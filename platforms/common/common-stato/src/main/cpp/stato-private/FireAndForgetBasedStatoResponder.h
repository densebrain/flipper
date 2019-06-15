#include <utility>

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include <stato/StatoResponder.h>
#include <stato/StatoConnection.h>
#include <stato/StatoDefaultConnection.h>
#include <stato/utils/Messaging.h>
#include <folly/json.h>


namespace stato {

/* Responder for responding to legacy stato applications.
   Originally, stato desktop used fireAndForget for all messages, so calling
   the SDK would send a fire and forget message, to which the SDK would respond
   with another one, with an id field that stato uses to map it to the
   original request. This Responder should be used when such requests are
   received.
 */
  class FireAndForgetBasedStatoResponder : public StatoResponder {
    public:
    FireAndForgetBasedStatoResponder(
      StatoDefaultConnection *socket,
      std::string requestId,
      PayloadType payloadType
    )
      : connection(socket), responseId(std::move(requestId)), payloadType(std::move(payloadType)) {}


    void success(const EnvelopePayload & payload) override {
      Envelope envelope;
      envelope.mutable_payload()->CopyFrom(payload);
      pbRefSet(envelope, request_id, responseId);
      pbRefSet(envelope, is_response, true);
      pbRefSet(envelope, is_error, false);

      connection->sendMessage(envelope);
    }

    void error(const ErrorRequestResponse &error) override {
      Envelope envelope;
      envelope.mutable_payload()->set_body(messageToJson(error));

      pbRefSet(envelope, request_id, responseId);
      pbRefSet(envelope, is_response, true);
      pbRefSet(envelope, is_error, true);

      connection->sendMessage(envelope);

    }


    private:
    StatoDefaultConnection *connection;
    std::string responseId;
    PayloadType payloadType;
  };

} // namespace stato

