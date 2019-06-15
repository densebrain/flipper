/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include <stato/StatoClientInit.h>
#include <stato/StatoConnection.h>
#include <stato/StatoState.h>
#include <folly/Executor.h>
#include <folly/io/async/EventBase.h>
#include <rsocket/RSocket.h>
#include <mutex>

namespace stato {

  class ConnectionEvents;

  class StatoConnectionContextStore;

  class StatoDefaultRSocketResponder;



  class StatoDefaultConnection : public StatoConnection {
    friend ConnectionEvents;

    public:
    StatoDefaultConnection(
      const StatoClientInit &init,
      std::shared_ptr<StatoState> state,
      std::shared_ptr<StatoConnectionContextStore> contextStore
    );

    ~StatoDefaultConnection() override;


    void start() override;

    void stop() override;

    bool isOpen() const override;

    //std::shared_ptr<StatoDisposer> addMessageListener(PayloadType type, std::shared_ptr<StatoMessageListener> listener) override;

    void setCallbacks(Callbacks *callbacks) override;

    Envelope toMessage(const Envelope &envelope) override;

    const SDKState & getSDKState() const override;

    const SDKConfig & getSDKConfig() const override;

    void sendMessage(const Envelope &metadata);

    void onMessageReceived(
      const PayloadType payloadType,
      const Envelope &envelope,
      const EnvelopePayload &payload,
      std::unique_ptr<StatoResponder> responder
    ) override;

    void reconnect() override ;

    bool isConnectionTrusted() override ;

    Callbacks * getCallbacks() override;

    void setOpen(bool open) override;

    bool isOpen() override;

    private:
    std::atomic_bool open {false}, connectionIsTrusted {false};
    Callbacks *callbacks;
    StatoClientInit init;
    std::shared_ptr<StatoState> statoState;


    folly::EventBase *statoEventBase;
    folly::EventBase *connectionEventBase;
    std::unique_ptr<rsocket::RSocketClient> client;
    int failedConnectionAttempts = 0;
    std::shared_ptr<StatoConnectionContextStore> contextStore;

    void startSync();
    void doCertificateExchange();
    void connectSecurely();
    bool isCertificateExchangeNeeded();
    void requestSignedCertFromStato();
    bool isRunningInOwnThread();

  };

} // namespace stato

