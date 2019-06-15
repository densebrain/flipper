/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include <folly/json.h>
#include <memory>
#include <stato/StatoResponder.h>
#include <stato-models/Envelope.pb.h>
#include <stato/StatoResponder.h>
#include <stato/StatoDisposable.h>

namespace stato {

  using namespace models;



  class StatoConnection {
    public:
    class Callbacks;

    public:
    virtual ~StatoConnection() {};

    /**
     Establishes a connection to the ws server.
     */
    virtual void start() = 0;

    /**
     Closes an open connection to the ws server.
     */
    virtual void stop() = 0;

    /**
     True if there's an open connection.
     This method may block if the connection is busy.
     */
    virtual bool isOpen() const = 0;


    virtual const SDKState & getSDKState() const = 0;

    virtual const SDKConfig & getSDKConfig() const = 0;

    //virtual std::shared_ptr<StatoDisposer> addMessageListener(PayloadType type, std::shared_ptr<StatoMessageListener> listener) = 0;

    /**
     Send message to the ws server.
     */
    //virtual void sendMessage(const StatoEnvelope &metadata) = 0;


    virtual Envelope toMessage(const Envelope & envelope) = 0;

    /**
     Handler for connection and message receipt from the ws server.
     The callbacks should be set before a connection is established.
     */
    virtual void setCallbacks(Callbacks *callbacks) = 0;

    /**
     Called by ws server when a message has been received.
    */
    virtual void onMessageReceived(
      const PayloadType payloadType,
      const Envelope &envelope,
      const EnvelopePayload &payload,
      std::unique_ptr<StatoResponder> responder
    ) = 0;

    virtual bool isConnectionTrusted() = 0;

    virtual Callbacks * getCallbacks() = 0;

    virtual void setOpen(bool open) = 0;

    virtual bool isOpen() = 0;

    virtual void reconnect() = 0;

  };

  class StatoConnection::Callbacks {
    public:
    virtual ~Callbacks() {};

    virtual void onConnected(const StatoConnection * conn) = 0;

    virtual void onDisconnected(const StatoConnection * conn) = 0;

    //virtual void onMessageReceived(
    //  const PayloadType payloadType,
    //  const Envelope &envelope,
    //  const EnvelopePayload &payload,
    //  std::unique_ptr<StatoResponder> responder
    //) = 0;
  };

} // namespace stato

