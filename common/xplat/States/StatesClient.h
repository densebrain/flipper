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
#include "StatesConnectionImpl.h"
#include "StatesConnectionManager.h"
#include "StatesInitConfig.h"
#include "StatesPlugin.h"
#include "StatesState.h"
#include "StatesStep.h"

namespace facebook {
namespace states {

class StatesClient : public StatesConnectionManager::Callbacks {
 public:
  /**
   Call before accessing instance with StatesClient::instance(). This will set
   up all the state needed to establish a States connection.
   */
  static void init(StatesInitConfig config);

  /**
   Standard accessor for the shared StatesClient instance. This returns a
   singleton instance to a shared StatesClient. First call to this function
   will create the shared StatesClient. Must call
   StatesClient::initDeviceData() before first call to
   StatesClient::instance().
   */
  static StatesClient* instance();

  /**
   Only public for testing
   */
  StatesClient(
      std::unique_ptr<StatesConnectionManager> socket,
      std::shared_ptr<StatesState> state)
      : socket_(std::move(socket)), statesState_(state) {
    auto step = statesState_->start("Create client");
    socket_->setCallbacks(this);
    auto& conn = connections_["states-crash-report"];
    conn = std::make_shared<StatesConnectionImpl>(
        socket_.get(), "states-crash-report");
    step->complete();
  }

  void start() {
    performAndReportError([this]() {
      auto step = statesState_->start("Start client");
      socket_->start();
      step->complete();
    });
  }

  void stop() {
    performAndReportError([this]() {
      auto step = statesState_->start("Stop client");
      socket_->stop();
      step->complete();
    });
  }

  void onConnected() override;

  void onDisconnected() override;

  void onMessageReceived(
      const folly::dynamic& message,
      std::unique_ptr<StatesResponder>) override;

  void addPlugin(std::shared_ptr<StatesPlugin> plugin);

  void removePlugin(std::shared_ptr<StatesPlugin> plugin);

  void refreshPlugins();

  void setStateListener(
      std::shared_ptr<StatesStateUpdateListener> stateListener);

  std::shared_ptr<StatesPlugin> getPlugin(const std::string& identifier);

  std::string getState();

  std::vector<StateElement> getStateElements();

  template <typename P>
  std::shared_ptr<P> getPlugin(const std::string& identifier) {
    return std::static_pointer_cast<P>(getPlugin(identifier));
  }

  bool hasPlugin(const std::string& identifier);
  void performAndReportError(const std::function<void()>& func);

 private:
  static StatesClient* instance_;
  bool connected_ = false;
  std::unique_ptr<StatesConnectionManager> socket_;
  std::map<std::string, std::shared_ptr<StatesPlugin>> plugins_;
  std::map<std::string, std::shared_ptr<StatesConnectionImpl>> connections_;
  std::mutex mutex_;
  std::shared_ptr<StatesState> statesState_;

  void disconnect(std::shared_ptr<StatesPlugin> plugin);
  void startBackgroundPlugins();
  std::string callstack();
  void handleError(std::exception& e);
};

} // namespace states
} // namespace facebook
