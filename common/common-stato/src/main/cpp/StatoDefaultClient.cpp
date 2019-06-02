/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include <stato/StatoDefaultClient.h>
#include <fstream>
#include <iostream>
#include <stdexcept>
#include <vector>
#include <stato/ConnectionContextStore.h>
#include <stato/FireAndForgetBasedStatoResponder.h>


#include <stato/StatoPluginConnectionImpl.h>
#include <stato/StatoConnectionImpl.h>
#include <stato/StatoResponderImpl.h>
#include <stato/StatoState.h>
#include <stato/StatoStep.h>
#include <stato/Log.h>

#if __ANDROID__

#include <stato/utils/CallstackHelper.h>

#endif
#if __APPLE__
#include <execinfo.h>
#endif

#if FB_SONARKIT_ENABLED


namespace stato {


  using folly::dynamic;
  using namespace stato::utils;

  StatoDefaultClient::StatoDefaultClient() : socket_(nullptr), state_(std::make_shared<StatoState>()) {

  }

  void StatoDefaultClient::init(StatoClientConfig config) {
    auto context = std::make_shared<ConnectionContextStore>(config.deviceData);
    socket_ = std::make_unique<StatoConnectionImpl>(
      std::move(config),
      state_,
      context
    );

    auto step = state_->start("Create client");
    socket_->setCallbacks(this);
    auto &conn = connections_["stato-crash-report"];
    conn = std::make_shared<StatoPluginConnectionImpl>(
      socket_.get(),
      "stato-crash-report"
    );
    step->complete();

    //kInstance = new StatoClient(
    //    std::make_unique<StatoConnectionManagerImpl>(
    //        std::move(config), state, context),
    //    state);
  }

  void StatoDefaultClient::setStateListener(
    std::shared_ptr<StatoStateUpdateListener> stateListener) {
    performAndReportError([this, &stateListener]() {
      log("Setting state listener");
      state_->setUpdateListener(stateListener);
    });
  }

  void StatoDefaultClient::addPlugin(std::shared_ptr<StatoPlugin> plugin) {
    performAndReportError([this, plugin]() {
      log("StatoDefaultClient::addPlugin " + plugin->identifier());
      auto step = state_->start("Add plugin " + plugin->identifier());

      std::lock_guard<std::mutex> lock(mutex_);
      if (plugins_.find(plugin->identifier()) != plugins_.end()) {
        throw std::out_of_range(
          "plugin " + plugin->identifier() + " already added.");
      }
      plugins_[plugin->identifier()] = plugin;
      step->complete();
      if (connected_) {
        refreshPlugins();
        if (plugin->runInBackground()) {
          auto &conn = connections_[plugin->identifier()];
          conn = std::make_shared<StatoPluginConnectionImpl>(
            socket_.get(), plugin->identifier());
          plugin->didConnect(conn);
        }
      }
    });
  }

  void StatoDefaultClient::removePlugin(std::shared_ptr<StatoPlugin> plugin) {
    performAndReportError([this, plugin]() {
      log("StatoDefaultClient::removePlugin " + plugin->identifier());

      std::lock_guard<std::mutex> lock(mutex_);
      if (plugins_.find(plugin->identifier()) == plugins_.end()) {
        throw std::out_of_range("plugin " + plugin->identifier() + " not added.");
      }
      disconnect(plugin);
      plugins_.erase(plugin->identifier());
      if (connected_) {
        refreshPlugins();
      }
    });
  }

  void StatoDefaultClient::startBackgroundPlugins() {
    std::cout << "Activating Background Plugins..." << std::endl;
    for (auto it =
      plugins_.begin();
         it != plugins_.end();
         ++it) {
      std::cout << it->first << std::endl;
      if (it->second.get()->runInBackground()) {
        auto &conn = connections_[it->first];
        conn = std::make_shared<StatoPluginConnectionImpl>(socket_.get(), it->first);
        it->second.get()->didConnect(conn);
      }
    }
  }

  std::shared_ptr<StatoPlugin> StatoDefaultClient::getPlugin(
    const std::string &identifier) {
    std::lock_guard<std::mutex> lock(mutex_);
    if (plugins_.find(identifier) == plugins_.end()) {
      return nullptr;
    }
    return plugins_.at(identifier);
  }

  bool StatoDefaultClient::hasPlugin(const std::string &identifier) {
    std::lock_guard<std::mutex> lock(mutex_);
    return plugins_.find(identifier) != plugins_.end();
  }

  void StatoDefaultClient::disconnect(std::shared_ptr<StatoPlugin> plugin) {
    const auto &conn = connections_.find(plugin->identifier());
    if (conn != connections_.end()) {
      connections_.erase(plugin->identifier());
      plugin->didDisconnect();
    }
  }

  void StatoDefaultClient::refreshPlugins() {
    performAndReportError([this]() {
      dynamic message = dynamic::object("method", "refreshPlugins");
      socket_->sendMessage(message);
    });
  }

  void StatoDefaultClient::onConnected() {
    performAndReportError([this]() {
      log("StatoDefaultClient::onConnected");

      std::lock_guard<std::mutex> lock(mutex_);
      connected_ = true;
      startBackgroundPlugins();
    });
  }

  void StatoDefaultClient::onDisconnected() {
    performAndReportError([this]() {
      log("StatoDefaultClient::onDisconnected");
      auto step = state_->start("Trigger onDisconnected callbacks");
      std::lock_guard<std::mutex> lock(mutex_);
      connected_ = false;
      for (const auto &iter : plugins_) {
        disconnect(iter.second);
      }
      step->complete();
    });
  }

  void StatoDefaultClient::onMessageReceived(
    const dynamic &message,
    std::unique_ptr<StatoResponder> uniqueResponder) {
    // Convert to shared pointer so we can hold on to it while passing it to the plugin, and still use it
    // to respond with an error if we catch an exception.
    std::shared_ptr<StatoResponder> responder = std::move(uniqueResponder);
    try {
      std::lock_guard<std::mutex> lock(mutex_);
      const auto &method = message["method"];
      const auto &payload = message.getDefault("payload");

      if (method == "getPlugins") {
        dynamic identifiers = dynamic::array();
        for (const auto &elem : plugins_) {
          identifiers.push_back(elem.first);
        }
        dynamic response = dynamic::object("plugins", identifiers);
        responder->success(response);
        return;
      }

      if (method == "init") {
        const auto identifier = payload["plugin"].getString();
        if (plugins_.find(identifier) == plugins_.end()) {
          std::string errorMessage = "Plugin " + identifier +
                                     " not found for method " + method.getString();
          log(errorMessage);
          responder->error(folly::dynamic::object("message", errorMessage)(
            "name", "PluginNotFound"));
          return;
        }
        const auto plugin = plugins_.at(identifier);
        if (!plugin.get()->runInBackground()) {
          auto &conn = connections_[plugin->identifier()];
          conn = std::make_shared<StatoPluginConnectionImpl>(
            socket_.get(), plugin->identifier());
          plugin->didConnect(conn);
        }
        return;
      }

      if (method == "deinit") {
        const auto identifier = payload["plugin"].getString();
        if (plugins_.find(identifier) == plugins_.end()) {
          std::string errorMessage = "Plugin " + identifier +
                                     " not found for method " + method.getString();
          log(errorMessage);
          responder->error(folly::dynamic::object("message", errorMessage)(
            "name", "PluginNotFound"));
          return;
        }
        const auto plugin = plugins_.at(identifier);
        if (!plugin.get()->runInBackground()) {
          disconnect(plugin);
        }
        return;
      }

      if (method == "execute") {
        const auto identifier = payload["api"].getString();
        if (connections_.find(identifier) == connections_.end()) {
          std::string errorMessage = "Connection " + identifier +
                                     " not found for method " + method.getString();
          log(errorMessage);
          responder->error(folly::dynamic::object("message", errorMessage)(
            "name", "ConnectionNotFound"));
          return;
        }
        const auto &conn = connections_.at(payload["api"].getString());
        conn->call(
          payload["type"].getString(),
          payload.getDefault("payload"),
          responder);
        return;
      }

      if (method == "isMethodSupported") {
        const auto identifier = payload["api"].getString();
        if (connections_.find(identifier) == connections_.end()) {
          std::string errorMessage = "Connection " + identifier +
                                     " not found for method " + method.getString();
          log(errorMessage);
          responder->error(folly::dynamic::object("message", errorMessage)(
            "name", "ConnectionNotFound"));
          return;
        }
        const auto &conn = connections_.at(payload["api"].getString());
        bool isSupported = conn->hasReceiver(payload["method"].getString());
        responder->success(dynamic::object("isSupported", isSupported));
        return;
      }

      dynamic response =
        dynamic::object("message", "Received unknown method: " + method);
      responder->error(response);
    } catch (std::exception &e) {
      log(std::string("Error: ") + e.what());
      if (responder) {
        responder->error(dynamic::object("message", e.what())(
          "stacktrace", callstack())("name", e.what()));
      }
    } catch (...) {
      log("Unknown error suppressed in StatoClient");
      if (responder) {
        responder->error(dynamic::object(
          "message",
          "Unknown error during " + message["method"] + ". " +
          folly::toJson(message))("stacktrace", callstack())(
          "name", "Unknown"));
      }
    }
  }

  std::string StatoDefaultClient::callstack() {
#if __APPLE__
    // For some iOS apps, __Unwind_Backtrace symbol wasn't found in sandcastle
    // builds, thus, for iOS apps, using backtrace c function.
    void* callstack[2048];
    int frames = backtrace(callstack, 2048);
    char** strs = backtrace_symbols(callstack, frames);
    std::string output = "";
    for (int i = 0; i < frames; ++i) {
      output.append(strs[i]);
      output.append("\n");
    }
    return output;
#elif __ANDROID__
    const size_t max = 2048;
    void *buffer[max];
    std::ostringstream oss;

    dumpBacktrace(oss, buffer, captureBacktrace(buffer, max));
    std::string output = std::string(oss.str().c_str());
    return output;
#else
    return "";
#endif
  }

  void StatoDefaultClient::performAndReportError(const std::function<void()> &func) {
#if STATO_ENABLE_CRASH
    // To debug the stack trace and an exception turn on the compiler flag
    // STATO_ENABLE_CRASH
    func();
#else
    try {
      func();
    } catch (std::exception &e) {
      handleError(e);
    } catch (std::exception *e) {
      if (e) {
        handleError(*e);
      }
    } catch (...) {
      // Generic catch block for the exception of type not belonging to
      // std::exception
      log("Unknown error suppressed in StatoClient");
    }
#endif
  }

  void StatoDefaultClient::handleError(std::exception &e) {
    if (connected_) {
      std::string callstack = this->callstack();
      dynamic message = dynamic::object(
        "error",
        dynamic::object("message", e.what())("stacktrace", callstack)(
          "name", e.what()));
      socket_->sendMessage(message);
    } else {
      log("Error: " + std::string(e.what()));
    }
  }

  std::string StatoDefaultClient::getState() {
    return state_->getState();
  }

  std::vector<StateElement> StatoDefaultClient::getStateElements() {
    return state_->getStateElements();
  }

} // namespace stato


#endif
