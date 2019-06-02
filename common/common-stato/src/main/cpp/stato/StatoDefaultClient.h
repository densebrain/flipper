/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include <map>
#include <mutex>
#include <vector>
#include <stato/StatoPluginConnectionImpl.h>
#include <stato/StatoConnection.h>
#include <stato/StatoClientConfig.h>
#include <stato/StatoPlugin.h>
#include <stato/StatoState.h>
#include <stato/StatoStep.h>
#include <stato/StatoClient.h>

namespace stato {

  class StatoDefaultClient : public StatoClient {
    public:
    /**
     Call before accessing instance with StatoClient::instance(). This will set
     up all the state needed to establish a Stato connection.
     */
    void init(StatoClientConfig config);

    /**
     Only public for testing
     */
    StatoDefaultClient();
    ~StatoDefaultClient() = default;

    void start() {
      performAndReportError([this]() {
        auto step = state_->start("Start client");
        socket_->start();
        step->complete();
      });
    }

    void stop() {
      performAndReportError([this]() {
        auto step = state_->start("Stop client");
        socket_->stop();
        step->complete();
      });
    }

    void onConnected() override;

    void onDisconnected() override;

    void onMessageReceived(
      const folly::dynamic &message,
      std::unique_ptr<StatoResponder>) override;

    void addPlugin(std::shared_ptr<StatoPlugin> plugin);

    void removePlugin(std::shared_ptr<StatoPlugin> plugin);

    void refreshPlugins();

    void setStateListener(
      std::shared_ptr<StatoStateUpdateListener> stateListener);

    std::shared_ptr<StatoPlugin> getPlugin(const std::string &identifier);

    std::string getState();

    std::vector<StateElement> getStateElements();

    template<typename P>
    std::shared_ptr<P> getPlugin(const std::string &identifier) {
      return std::static_pointer_cast<P>(getPlugin(identifier));
    }

    bool hasPlugin(const std::string &identifier);
    void performAndReportError(const std::function<void()> &func);

    private:
    bool connected_ = false;
    std::unique_ptr<StatoConnection> socket_;
    std::map<std::string, std::shared_ptr<StatoPlugin>> plugins_{};
    std::map<std::string, std::shared_ptr<StatoPluginConnectionImpl>> connections_{};
    std::mutex mutex_ {};
    std::shared_ptr<StatoState> state_;

    void disconnect(std::shared_ptr<StatoPlugin> plugin);
    void startBackgroundPlugins();
    std::string callstack();
    void handleError(std::exception &e);
  };

} // namespace stato

