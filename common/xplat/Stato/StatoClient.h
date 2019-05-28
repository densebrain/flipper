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
#include "StatoConnectionImpl.h"
#include "StatoConnectionManager.h"
#include "StatoInitConfig.h"
#include "StatoPlugin.h"
#include "StatoState.h"
#include "StatoStep.h"

namespace facebook {
namespace stato {

class StatoClient : public StatoConnectionManager::Callbacks {
 public:
  /**
   Call before accessing instance with StatoClient::instance(). This will set
   up all the state needed to establish a Stato connection.
   */
  static void init(StatoInitConfig config);

  /**
   Standard accessor for the shared StatoClient instance. This returns a
   singleton instance to a shared StatoClient. First call to this function
   will create the shared StatoClient. Must call
   StatoClient::initDeviceData() before first call to
   StatoClient::instance().
   */
  static StatoClient* instance();

  /**
   Only public for testing
   */
  StatoClient(
      std::unique_ptr<StatoConnectionManager> socket,
      std::shared_ptr<StatoState> state)
      : socket_(std::move(socket)), statoState_(state) {
    auto step = statoState_->start("Create client");
    socket_->setCallbacks(this);
    auto& conn = connections_["stato-crash-report"];
    conn = std::make_shared<StatoConnectionImpl>(
        socket_.get(), "stato-crash-report");
    step->complete();
  }

  void start() {
    performAndReportError([this]() {
      auto step = statoState_->start("Start client");
      socket_->start();
      step->complete();
    });
  }

  void stop() {
    performAndReportError([this]() {
      auto step = statoState_->start("Stop client");
      socket_->stop();
      step->complete();
    });
  }

  void onConnected() override;

  void onDisconnected() override;

  void onMessageReceived(
      const folly::dynamic& message,
      std::unique_ptr<StatoResponder>) override;

  void addPlugin(std::shared_ptr<StatoPlugin> plugin);

  void removePlugin(std::shared_ptr<StatoPlugin> plugin);

  void refreshPlugins();

  void setStateListener(
      std::shared_ptr<StatoStateUpdateListener> stateListener);

  std::shared_ptr<StatoPlugin> getPlugin(const std::string& identifier);

  std::string getState();

  std::vector<StateElement> getStateElements();

  template <typename P>
  std::shared_ptr<P> getPlugin(const std::string& identifier) {
    return std::static_pointer_cast<P>(getPlugin(identifier));
  }

  bool hasPlugin(const std::string& identifier);
  void performAndReportError(const std::function<void()>& func);

 private:
  static StatoClient* instance_;
  bool connected_ = false;
  std::unique_ptr<StatoConnectionManager> socket_;
  std::map<std::string, std::shared_ptr<StatoPlugin>> plugins_;
  std::map<std::string, std::shared_ptr<StatoConnectionImpl>> connections_;
  std::mutex mutex_;
  std::shared_ptr<StatoState> statoState_;

  void disconnect(std::shared_ptr<StatoPlugin> plugin);
  void startBackgroundPlugins();
  std::string callstack();
  void handleError(std::exception& e);
};

} // namespace stato
} // namespace facebook
