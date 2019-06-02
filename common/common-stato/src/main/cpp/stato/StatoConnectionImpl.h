/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include <stato/StatoClientConfig.h>
#include <stato/StatoConnection.h>
#include <stato/StatoState.h>
#include <folly/Executor.h>
#include <folly/io/async/EventBase.h>
#include <rsocket/RSocket.h>
#include <mutex>


namespace stato {

class ConnectionEvents;
class ConnectionContextStore;
class StatoRSocketResponder;

rsocket::Payload toRSocketPayload(folly::dynamic data);

class StatoConnectionImpl : public StatoConnection {
  friend ConnectionEvents;

 public:
  StatoConnectionImpl(StatoClientConfig config, std::shared_ptr<StatoState> state, std::shared_ptr<ConnectionContextStore> contextStore);

  ~StatoConnectionImpl();

  void start() override;

  void stop() override;

  bool isOpen() const override;

  void setCallbacks(Callbacks* callbacks) override;

  void sendMessage(const folly::dynamic& message) override;

  void onMessageReceived(
      const folly::dynamic& message,
      std::unique_ptr<StatoResponder> responder) override;

  void reconnect();

 private:
  bool isOpen_ = false;
  Callbacks* callbacks_;
  DeviceData deviceData_;
  std::shared_ptr<StatoState> statoState_;
  int insecurePort;
  int securePort;

  folly::EventBase* statoEventBase_;
  folly::EventBase* connectionEventBase_;
  std::unique_ptr<rsocket::RSocketClient> client_;
  bool connectionIsTrusted_;
  int failedConnectionAttempts_ = 0;
  std::shared_ptr<ConnectionContextStore> contextStore_;

  void startSync();
  void doCertificateExchange();
  void connectSecurely();
  bool isCertificateExchangeNeeded();
  void requestSignedCertFromStato();
  bool isRunningInOwnThread();
  void sendLegacyCertificateRequest(folly::dynamic message);
  std::string getDeviceId();
};

} // namespace stato

