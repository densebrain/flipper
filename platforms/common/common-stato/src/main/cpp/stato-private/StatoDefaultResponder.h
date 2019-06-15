#include <utility>

#include <utility>

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include <folly/io/async/EventBase.h>
#include <folly/json.h>
#include <rsocket/RSocketResponder.h>
#include <stato/StatoConnection.h>
#include <stato/StatoResponder.h>
#include <stato/StatoRequestResponse.h>
#include <stato/Log.h>
#include <stato/utils/Messaging.h>

namespace stato {

  using namespace util;

/* Responder to encapsulate yarpl observables and hide them from stato core +
 * plugins */
  class StatoDefaultResponder : public StatoResponder {
    public:
    StatoDefaultResponder(
      const Envelope & envelope,
      const EnvelopePayload & payload,
      std::shared_ptr<yarpl::single::SingleObserver<const Envelope &>> downstreamObserver
    ) : envelope(copyMessage(envelope)), payload(copyMessage(payload)), downstreamObserver_(std::move(downstreamObserver)) {}

    void success(const EnvelopePayload & payload) override {

      isCompleted = true;
      auto newEnvelope = copyMessage(envelope);
      newEnvelope.mutable_payload()->MergeFrom(copyMessage(payload));
      downstreamObserver_->onSuccess(newEnvelope);
    }

    void error(const ErrorRequestResponse &response) override {
      //const folly::dynamic message = folly::dynamic::object("error", response);

      isCompleted = true;
      auto newEnvelope = copyMessage(envelope);
      newEnvelope.mutable_payload()->set_body(messageToJson(response));
      newEnvelope.set_is_error(true);

      downstreamObserver_->onSuccess(newEnvelope);
    }

    ~StatoDefaultResponder() {
      if (!isCompleted) {
        try {
          //newPayload.mutable_response()->PackFrom(response);
          downstreamObserver_->onSuccess(envelope);
          //downstreamObserver_->onSuccess(
          //  folly::dynamic::object("success", folly::dynamic::object()));
        } catch (std::exception &e) {
          log(std::string(
            "Exception occurred when responding in StatoResponder: ") +
              e.what());
        } catch (...) {
          log("Exception occurred when responding in StatoResponder");
        }
      }
    }

    private:
    Envelope envelope;
    EnvelopePayload payload;
    std::shared_ptr<yarpl::single::SingleObserver<const Envelope &>>
      downstreamObserver_;
    bool isCompleted = false;
  };

} // namespace stato

