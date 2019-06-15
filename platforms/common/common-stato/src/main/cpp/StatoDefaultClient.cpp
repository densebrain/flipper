#pragma clang diagnostic push
#pragma ide diagnostic ignored "cert  -err09-cpp"
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include <stato/StatoDefaultClient.h>
#include <fstream>
#include <iostream>
#include <functional>
#include <stdexcept>
#include <vector>
#include <stato/utils/CallstackHelper.h>

#include <stato/StatoConnectionContextStore.h>
#include <stato-private/FireAndForgetBasedStatoResponder.h>

#include <stato/StatoDefaultPluginConnection.h>
#include <stato/StatoDefaultConnection.h>
#include <stato-private/StatoDefaultResponder.h>
#include <stato/StatoState.h>
#include <stato/StatoStep.h>
#include <stato/Log.h>
#include <stato-models/PayloadType.pb.h>
#include <stato-models/Payload.pb.h>

#if __ANDROID__



#endif
#if __APPLE__

#include <execinfo.h>
#include <stato/utils/Messaging.h>

#endif

#if FB_SONARKIT_ENABLED

namespace stato {

  using namespace logger;
  using namespace models;

  using folly::dynamic;
#if __ANDROID__
  using namespace stato::utils;
#endif

  using namespace google::protobuf::util;


//  template<typename T>
//  using Listener = std::function<void(
//    const PayloadType payloadType,
//    const T & payloadMessage,
//    const Envelope &envelope,
//    const EnvelopePayload &payload,
//    std::unique_ptr<StatoResponder> responder
//  )>;

//  template<typename T>
//  StatoMessagePayloadListener<T> makeListener(StatoDefaultClient * client, StatoMessagePayloadListener<T>  * fn) {
//    StatoMessagePayloadListener<T> bound = std::bind(fn,client, std::placeholders::_1, std::placeholders::_2, std::placeholders::_3, std::placeholders::_4, std::placeholders::_5);
//    return bound;
//  }

  StatoDefaultClient::StatoDefaultClient() : conn(nullptr), state(std::make_shared<StatoState>()) {



//    auto makeListener = [this] (auto auto fn) {
//      std::function<void(
//        const PayloadType payloadType,
//        const T & payloadMessage,
//        const Envelope &envelope,
//        const EnvelopePayload &payload,
//        std::unique_ptr<StatoResponder> responder
//      )> bound = std::bind(fn,this, std::placeholders::_1, std::placeholders::_2, std::placeholders::_3, std::placeholders::_4, std::placeholders::_5);
//      return bound;
//    };
#define RegHandler(P, B, Fn) registerHandler<B>(\
    P,\
      std::bind(\
        &StatoDefaultClient::Fn,\
        this,\
        std::placeholders::_1,\
        std::placeholders::_2,\
        std::placeholders::_3,\
        std::placeholders::_4,\
        std::placeholders::_5\
      )\
    );

    RegHandler(PayloadTypePluginList,PluginListResponse,handlePluginList)
    RegHandler(PayloadTypePluginSetActive, PluginSetActiveRequestResponse, handlePluginSetActive);
    RegHandler(PayloadTypePluginCall, PluginCallRequestResponse, handlePluginCall);
    RegHandler(PayloadTypePluginSupported, PluginSupportedRequestResponse, handlePluginSupported);

    //    registerHandler<PluginSetActiveRequestResponse>(PayloadTypePluginSetActive, makeListener<PluginSetActiveRequestResponse>(this, &StatoDefaultClient::handlePluginSetActive));
//    registerHandler<PluginCallRequestResponse>(PayloadTypePluginCall, makeListener<PluginCallRequestResponse>(this, &StatoDefaultClient::handlePluginCall));
//    registerHandler<PluginSupportedRequestResponse>(PayloadTypePluginSupported, makeListener<PluginSupportedRequestResponse>(this, &StatoDefaultClient::handlePluginSupported));
//    (
//      PayloadTypePluginList,
//      std::bind(
//        &StatoDefaultClient::handlePluginList,
//        this,
//        std::placeholders::_1,
//        std::placeholders::_2,
//        std::placeholders::_3,
//        std::placeholders::_4,
//        std::placeholders::_5
//      )
//    );
    //makeListener<PluginListResponse>(this, &handlePluginList));

  }

  void StatoDefaultClient::init(StatoClientInit init) {
    auto context = std::make_shared<StatoConnectionContextStore>(init.state);
    conn = std::make_unique<StatoDefaultConnection>(init, state, context);

    auto step = state->start("Create client");
    conn->setCallbacks(this);
    auto &pluginConn = pluginConnections["stato-crash-report"];
    pluginConn = std::make_shared<StatoDefaultPluginConnection>(conn.get(), "stato-crash-report");
    step->complete();
  }

  void StatoDefaultClient::setStateListener(std::shared_ptr<StatoStateUpdateListener> stateListener) {
    std::lock_guard<std::recursive_mutex> lock(mutex);
    performAndReportError([this, &stateListener]() {
      log("Setting state listener");
      state->setUpdateListener(stateListener);
    });
  }

  void StatoDefaultClient::addPlugin(std::shared_ptr<StatoPlugin> plugin) {
    std::lock_guard<std::recursive_mutex> lock(mutex);
    performAndReportError([this, plugin]() {
      debugStream() << "StatoDefaultClient::addPlugin " << plugin->identifier();

      auto step = state->start("Add plugin " + plugin->identifier());

      if (plugins.find(plugin->identifier()) != plugins.end()) {
        throw std::out_of_range("plugin " + plugin->identifier() + " already added.");
      }
      plugins[plugin->identifier()] = plugin;
      step->complete();

      if (connected) {
        refreshPlugins();
        if (plugin->runInBackground()) {
          auto &pluginConn = pluginConnections[plugin->identifier()];
          pluginConn = std::make_shared<StatoDefaultPluginConnection>(conn.get(), plugin->identifier());
          plugin->didConnect(pluginConn);
        }
      }
    });
  }

  void StatoDefaultClient::removePlugin(std::shared_ptr<StatoPlugin> plugin) {
    std::lock_guard<std::recursive_mutex> lock(mutex);
    performAndReportError([this, plugin]() {
      log("StatoDefaultClient::removePlugin " + plugin->identifier());

      if (plugins.find(plugin->identifier()) == plugins.end()) {
        throw std::out_of_range("plugin " + plugin->identifier() + " not added.");
      }
      disconnect(plugin);
      plugins.erase(plugin->identifier());
      if (connected) {
        refreshPlugins();
      }
    });
  }

  void StatoDefaultClient::startBackgroundPlugins() {
    std::lock_guard<std::recursive_mutex> lock(mutex);
    debugStream() << "Activating Background Plugins...";

    for (auto & [id, plugin] : plugins) {
      if (plugin->runInBackground()) {
        debugStream() << "startBackgroundPlugins: Starting " << id;

        auto &pluginConn = pluginConnections[id];
        pluginConn = std::make_shared<StatoDefaultPluginConnection>(conn.get(), id);
        plugin->didConnect(pluginConn);
      }
    }
  }

  std::shared_ptr<StatoPlugin> StatoDefaultClient::getPlugin(const std::string &identifier) {
    std::lock_guard<std::recursive_mutex> lock(mutex);
    return hasPlugin(identifier) ? plugins.at(identifier) : nullptr;
  }

  bool StatoDefaultClient::hasPlugin(const std::string &identifier) {
    std::lock_guard<std::recursive_mutex> lock(mutex);
    return plugins.find(identifier) != plugins.end();
  }

  void StatoDefaultClient::disconnect(std::shared_ptr<StatoPlugin> plugin) {
    std::lock_guard<std::recursive_mutex> lock(mutex);
    auto id = plugin->identifier();
    debugStream() << "Disconnecting Plugin " << id;
    const auto &conn = pluginConnections.find(id);
    if (conn != pluginConnections.end()) {
      pluginConnections.erase(plugin->identifier());
      plugin->didDisconnect();
    }
  }

  void StatoDefaultClient::refreshPlugins() {
    std::lock_guard<std::recursive_mutex> lock(mutex);
    performAndReportError([this]() {
      //{.method = "refreshPlugins", .payload = dynamic::object()}

      Envelope envelope;
      auto payload = envelope.mutable_payload();
      payload->set_type(PayloadType::PayloadTypePluginList);
      payload->set_body(messageToJson(PluginListRequest()));
      conn->sendMessage(envelope);
    });
  }

  void StatoDefaultClient::onConnected(const StatoConnection * conn) {
    std::lock_guard<std::recursive_mutex> lock(mutex);
    performAndReportError([this]() {
      log(" StatoDefaultClient::onConnected");
      connected = true;
      startBackgroundPlugins();
    });
  }

  void StatoDefaultClient::onDisconnected(const StatoConnection * conn) {
    std::lock_guard<std::recursive_mutex> lock(mutex);
    performAndReportError([this]() {
      log("StatoDefaultClient::onDisconnected");
      auto step = state->start("Trigger onDisconnected callbacks");
      connected = false;
      for (const auto &iter : plugins) {
        disconnect(iter.second);
      }
      step->complete();
    });
  }



//
//  void StatoDefaultClient::onMessageReceived(PayloadType payloadType,
//    const Envelope &envelope,
//    const EnvelopePayload &payload,
//    std::unique_ptr<StatoResponder> uniqueResponder) {
//
//    //infoStream() << "Message received: " << method;
//
//    // Convert to shared pointer so we can hold on to it while passing it to the plugin, and still use it
//    // to respond with an error if we catch an exception.
//    std::shared_ptr<StatoResponder> responder = std::move(uniqueResponder);
//    try {
//      std::lock_guard<std::recursive_mutex> lock(mutex);
//      //const auto &method = message["method"];
//      //const auto &payload = message.getDefault("payload");
//      const auto &requestId = envelope.request_id();
//      //const auto & payload = envelope.payload();
//      //const auto payloadType = payload.type();
////
////      if (PayloadTypePluginList == payloadType) {
////
////        PluginListResponse response;
////        dynamic identifiers = dynamic::array();
////
////        for (const auto &elem : plugins_) {
////          std::string pluginId = elem.first;
////          response.add_plugins(pluginId);
////        }
////
////        auto responsePayload = copyMessage(payload);
////        responsePayload.set_body(messageToJson(response));
////
////        //auto response = payload.response().PackFrom(msg);
////        //dynamic response = dynamic::object("payload", dynamic::object("plugins", identifiers));
////
////        responder->success(responsePayload);
////        return;
////      }
//
////      if (PayloadTypePluginSetActive == payloadType) {
////
////        PluginSetActiveRequestResponse request;
////        JsonStringToMessage(payload.body(),&request);
////
////        const auto identifier = request.plugin_id();//["plugin"].getString();
////        if (plugins_.find(identifier) == plugins_.end()) {
////          std::string errorMessage = "Plugin " + identifier + " not found for method " + PayloadType_Name(payloadType);
////          log(errorMessage);
////
////          ErrorRequestResponse error;
////          error.set_message(errorMessage);
////          error.set_stacktrace(callstack());
////          error.set_name(errorMessage);
////
////          responder->error(error);
////          //folly::dynamic::object("message", errorMessage)(
////          //"name", "PluginNotFound")
////          return;
////        }
////
////
////        // STOP ALL FIRST
////        for (auto &[key, value] : plugins_) {
////          if (!value.get()->runInBackground()) {
////            disconnect(value);
////          }
////        }
////
////        // START
////        const auto plugin = plugins_.at(identifier);
////        if (!plugin->runInBackground()) {
////          disconnect(plugin);
////        }
////
////        const auto newPluginId = plugins_.at(identifier);
////        if (!plugin->runInBackground()) {
////          auto &conn = connections_[plugin->identifier()];
////          conn = std::make_shared<StatoDefaultPluginConnection>(socket.get(), plugin->identifier());
////          plugin->didConnect(conn);
////        }
////        return;
////      }
//
//      //if ( == "deinit") {
//      //  const auto identifier = message["plugin"].getString();
//      //  if (plugins_.find(identifier) == plugins_.end()) {
//      //    std::string errorMessage = "Plugin " + identifier +
//      //                               " not found for method " + method;
//      //    log(errorMessage);
//      //    responder->error(folly::dynamic::object("message", errorMessage)(
//      //      "name", "PluginNotFound"));
//      //    return;
//      //  }
//      //  const auto plugin = plugins_.at(identifier);
//      //  if (!plugin.get()->runInBackground()) {
//      //    disconnect(plugin);
//      //  }
//      //  return;
//      //}
//
//      if (PayloadTypePluginCall == payloadType) {
//        std::shared_ptr<Envelope> newEnvelope = copyMessageToSharedPtr(envelope);
//        std::shared_ptr<PluginCallRequestResponse> newRequest = std::make_shared<PluginCallRequestResponse>();
//        JsonStringToMessage(payload.body(),newRequest.get());
//        //.UnpackTo(newRequest.get());
//
//        const auto api = newRequest->plugin_id();
//        const auto method = newRequest->method();
//        if (connections_.find(api) == connections_.end()) {
//          std::string errorMessage = "Connection " + api + " not found for method " + method;
//          ErrorRequestResponse error;
//          error.set_message(errorMessage);
//          error.set_stacktrace(callstack());
//          error.set_name(errorMessage);
//
//          responder->error(error);
//          return;
//        }
//
//        const auto &conn = connections_.at(api);
//
//
//        newEnvelope->mutable_payload()->set_type(PayloadTypePluginCall);
//
//        //requestResponse->api = api;
//        //requestResponse->type = type;
//        //requestResponse->method = method;
//        //requestResponse->requestId = requestId;
//
//
//        conn->call(method,
//          copyMessageToSharedPtr(*newEnvelope->mutable_payload()),
//          newEnvelope,
//          responder);
//        return;
//      }
//
//      if (payloadType == PayloadTypePluginSupported) {
//        std::shared_ptr<PluginSupportedRequestResponse> newRequest = std::make_shared<PluginSupportedRequestResponse>();
//        JsonStringToMessage(payload.body(),newRequest.get());
//        //payload.body().UnpackTo(newRequest.get());
//
//        const auto api = newRequest->plugin_id();
//        const auto method = newRequest->method();
//
//        if (connections_.find(api) == connections_.end()) {
//          std::string errorMessage = "Connection " + api + " not found for method " + method;
//          log(errorMessage);
//
//          ErrorRequestResponse error;
//          error.set_message(errorMessage);
//          error.set_stacktrace(callstack());
//          error.set_name(errorMessage);
//
//          responder->error(error);
//          //responder->error(folly::dynamic::object("message", errorMessage)(
//          //  "name", "ConnectionNotFound"));
//          return;
//        }
//
//        const auto &conn = connections_.at(api);
//        bool isSupported = conn->hasReceiver(method);
//
//        const auto newEnvelope = copyMessageToSharedPtr(envelope);
//
//        PluginSupportedRequestResponse response = copyMessage(*newRequest.get());
//        pbRefSet(response, is_supported, isSupported);
//        pbRefSet(response, plugin_id, newRequest->plugin_id());
//
//        auto newPayload = copyMessage(*newEnvelope->mutable_payload());
//        newPayload.set_body(messageToJson(response));
//
//        responder->success(newPayload);
//        return;
//      }
//
//      //dynamic response =
//      //  dynamic::object("message", "Received unknown method: " + method);
//      ErrorRequestResponse error;
//      std::string errorMsg = "Received unknown method: " + PayloadType_Name(payloadType);
//      error.set_message(errorMsg);
//      error.set_stacktrace(callstack());
//      error.set_name(errorMsg);
//
//      responder->error(error);
//    } catch (std::exception &e) {
//      log(std::string("Error: ") + e.what());
//      if (responder) {
//        ErrorRequestResponse error;
//        std::string errorMsg = "Unknown error during " + PayloadType_Name(payloadType) + ". ";// + messageToJson(envelope);
//
//        error.set_message(errorMsg);
//        error.set_stacktrace(callstack());
//        error.set_name(errorMsg);
//        responder->error(error);
//      }
//    } catch (...) {
//      log("Unknown error suppressed in StatoClient");
//      if (responder) {
//        ErrorRequestResponse error;
//        std::string errorMsg = "Unknown error during " + PayloadType_Name(payloadType) + ". ";// + messageToJson(envelope.);
//        error.set_message(errorMsg);
//        error.set_stacktrace(callstack());
//        error.set_name(errorMsg);
//
//        responder->error(error);
//      }
//    }
//  }



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
    if (connected) {
      std::string callstack = getCallstack();
      //dynamic
      //  errorPayload =
      //  dynamic::object("error", dynamic::object("message", e.what())("stacktrace", callstack)("name", e.what()));

      Envelope envelope;
      auto payload = envelope.mutable_payload();
      ErrorRequestResponse error;
      error.set_name(e.what());
      error.set_message(e.what());
      error.set_stacktrace(callstack);

      payload->set_type(PayloadType::PayloadTypeError);
      payload->set_body(messageToJson(error));
      conn->sendMessage(envelope);

      //socket->sendMessage(envelope);
    } else {
      errorStream() << "Error: " << std::string(e.what());
    }
  }

  std::string StatoDefaultClient::getState() {
    return state->getState();
  }

  std::vector<StateElement> StatoDefaultClient::getStateElements() {
    return state->getStateElements();
  }

  void StatoDefaultClient::start() {
    performAndReportError([this]() {
      auto step = state->start("Start client");
      conn->start();
      step->complete();
    });
  }

  void StatoDefaultClient::stop() {
    performAndReportError([this]() {
      auto step = state->start("Stop client");
      conn->stop();
      step->complete();
    });
  }

  void StatoDefaultClient::handlePluginList(
    const PayloadType type,
    const PluginListResponse &payloadMessage,
    const Envelope &envelope,
    const EnvelopePayload &payload,
    std::unique_ptr<StatoResponder> responder
  ) {
    PluginListResponse response;
    dynamic identifiers = dynamic::array();

    for (const auto &elem : plugins) {
      std::string pluginId = elem.first;
      response.add_plugins(pluginId);
    }

    auto responsePayload = copyMessage(payload);
    responsePayload.set_body(messageToJson(response));

    //auto response = payload.response().PackFrom(msg);
    //dynamic response = dynamic::object("payload", dynamic::object("plugins", identifiers));

    responder->success(responsePayload);
  }

  /**
   * Handle plugin set active
   *
   * @param type
   * @param payloadMessage
   * @param envelope
   * @param payload
   * @param responder
   */
  void StatoDefaultClient::handlePluginSetActive(
    const PayloadType type,
    const PluginSetActiveRequestResponse &payloadMessage,
    const Envelope &envelope,
    const EnvelopePayload &payload,
    std::unique_ptr<StatoResponder> responder
  ) {
    PluginSetActiveRequestResponse request;
    JsonStringToMessage(payload.body(),&request);

    const auto id = request.plugin_id();
    try {
      setActivePlugin(id);
    } catch (const std::exception & ex) {
      auto errorMessage = ex.what();
      errorStream() << "Unable to activate " << id << ": " << errorMessage;

      ErrorRequestResponse error;
      error.set_message(errorMessage);
      error.set_stacktrace(getCallstack());
      error.set_name(errorMessage);

      responder->error(error);
    }

  }

  /**
   * Is plugin supported
   *
   * @param type
   * @param payloadMessage
   * @param envelope
   * @param payload
   * @param responder
   */
  void StatoDefaultClient::handlePluginSupported(
    const PayloadType type,
    const PluginSupportedRequestResponse &payloadMessage,
    const Envelope &envelope,
    const EnvelopePayload &payload,
    std::unique_ptr<StatoResponder> responder
  ) {
    std::shared_ptr<PluginSupportedRequestResponse> newRequest = std::make_shared<PluginSupportedRequestResponse>();
    JsonStringToMessage(payload.body(),newRequest.get());
    //payload.body().UnpackTo(newRequest.get());

    const auto api = newRequest->plugin_id();
    const auto method = newRequest->method();

    if (pluginConnections.find(api) == pluginConnections.end()) {
      std::string errorMessage = "Connection " + api + " not found for method " + method;
      log(errorMessage);

      ErrorRequestResponse error;
      error.set_message(errorMessage);
      error.set_stacktrace(getCallstack());
      error.set_name(errorMessage);

      responder->error(error);
      //responder->error(folly::dynamic::object("message", errorMessage)(
      //  "name", "ConnectionNotFound"));
      return;
    }

    const auto &conn = pluginConnections.at(api);
    bool isSupported = conn->hasReceiver(method);

    const auto newEnvelope = copyMessageToSharedPtr(envelope);

    PluginSupportedRequestResponse response = copyMessage(*newRequest.get());
    pbRefSet(response, is_supported, isSupported);
    pbRefSet(response, plugin_id, newRequest->plugin_id());

    auto newPayload = copyMessage(*newEnvelope->mutable_payload());
    newPayload.set_body(messageToJson(response));

    responder->success(newPayload);
  }

  /**
   * Forward calls to plugins
   *
   * @param type
   * @param payloadMessage
   * @param envelope
   * @param payload
   * @param responder
   */
  void StatoDefaultClient::handlePluginCall(const PayloadType type,
    const PluginCallRequestResponse &payloadMessage, const Envelope &envelope,
    const EnvelopePayload &payload, std::unique_ptr<StatoResponder> responder) {

    std::shared_ptr<Envelope> newEnvelope = copyMessageToSharedPtr(envelope);
    std::shared_ptr<PluginCallRequestResponse> newRequest = std::make_shared<PluginCallRequestResponse>();
    JsonStringToMessage(payload.body(),newRequest.get());
    //.UnpackTo(newRequest.get());

    const auto api = newRequest->plugin_id();
    const auto method = newRequest->method();
    if (pluginConnections.find(api) == pluginConnections.end()) {
      std::string errorMessage = "Connection " + api + " not found for method " + method;
      ErrorRequestResponse error;
      error.set_message(errorMessage);
      error.set_stacktrace(getCallstack());
      error.set_name(errorMessage);

      responder->error(error);
      return;
    }

    const auto &conn = pluginConnections.at(api);


    newEnvelope->mutable_payload()->set_type(PayloadTypePluginCall);

    conn->call(method,
      copyMessageToSharedPtr(*newEnvelope->mutable_payload()),
      newEnvelope,
      std::move(responder));
  }

  /**
   * Set the active plugin
   *
   * @param id - of plugin to activate
   */
  void StatoDefaultClient::setActivePlugin(const std::string &id) {
    debugStream() << "Activating plugin " << id;

    if (plugins.find(id) == plugins.end()) {
      std::string errorMessage = "Plugin " + id + " not found for set active";
      errorStream() << errorMessage;
      throw std::out_of_range(errorMessage);
    }


    debugStream() << "Activating plugin " << id;

    if (plugins.find(id) == plugins.end()) {
      std::string errorMessage = "Plugin " + id + " not found for set active";
      errorStream() << errorMessage;


      //folly::dynamic::object("message", errorMessage)(
      //"name", "PluginNotFound")
      return;
    }


    // STOP ALL FIRST
    debugStream() << "Stopping non-background plugins";
    for (auto &[key, value] : plugins) {
      bool shouldStop = value->isConnected() && !value->runInBackground();
      debugStream() << "Plugin " << key << " connected=" << value->isConnected() << ", shouldStop=" << shouldStop;
      if (shouldStop) {
        debugStream() << "Stopping non-background plugin: " << key;
        disconnect(value);
      }
    }


    const auto plugin = plugins.at(id);
    if (!plugin->isConnected()) {
      //auto id = plugin->identifier();
      debugStream() << "Starting Plugin not in background " << id;
      auto &pluginConn = pluginConnections[id];
      pluginConn = std::make_shared<StatoDefaultPluginConnection>(conn.get(), id);
      plugin->didConnect(pluginConn);
    }
    return;
  }

} // namespace stato


#endif

#pragma clang diagnostic pop