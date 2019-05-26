/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include "StatesInitConfig.h"
#include "StatesConnectionManager.h"
#include "StatesState.h"
#include <folly/Executor.h>
#include <folly/io/async/EventBase.h>
#include <rsocket/RSocket.h>
#include <mutex>

namespace facebook {
namespace states {

class ConnectionEvents;
class ConnectionContextStore;
class StatesRSocketResponder;

rsocket::Payload toRSocketPayload(folly::dynamic data);

class StatesConnectionManagerImpl : public StatesConnectionManager {
  friend ConnectionEvents;

 public:
  StatesConnectionManagerImpl(StatesInitConfig config, std::shared_ptr<StatesState> state, std::shared_ptr<ConnectionContextStore> contextStore);

  ~StatesConnectionManagerImpl();

  void start() override;

  void stop() override;

  bool isOpen() const override;

  void setCallbacks(Callbacks* callbacks) override;

  void sendMessage(const folly::dynamic& message) override;

  void onMessageReceived(
      const folly::dynamic& message,
      std::unique_ptr<StatesResponder> responder) override;

  void reconnect();

 private:
  bool isOpen_ = false;
  Callbacks* callbacks_;
  DeviceData deviceData_;
  std::shared_ptr<StatesState> statesState_;
  int insecurePort;
  int securePort;

  folly::EventBase* statesEventBase_;
  folly::EventBase* connectionEventBase_;
  std::unique_ptr<rsocket::RSocketClient> client_;
  bool connectionIsTrusted_;
  int failedConnectionAttempts_ = 0;
  std::shared_ptr<ConnectionContextStore> contextStore_;

  void startSync();
  void doCertificateExchange();
  void connectSecurely();
  bool isCertificateExchangeNeeded();
  void requestSignedCertFromStates();
  bool isRunningInOwnThread();
  void sendLegacyCertificateRequest(folly::dynamic message);
  std::string getDeviceId();
};

} // namespace states
} // namespace facebook
