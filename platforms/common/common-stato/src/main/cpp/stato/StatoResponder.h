/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include <folly/json.h>
#include <stato-models/PayloadType.pb.h>
#include <stato-models/Payload.pb.h>
#include <stato-models/Envelope.pb.h>

namespace stato {

  using namespace models;

  /**
   * StatoResponder is used to asynchronously respond to messages
   * received from the Stato desktop app.
   */
  class StatoResponder {
    public:
    virtual ~StatoResponder() {};

    /**
     * Deliver a successful response to the Stato desktop app.
     */
    virtual void success(const EnvelopePayload &payload) = 0;

    /**
     * Inform the Stato desktop app of an error in handling the request.
     */
    virtual void error(const ErrorRequestResponse &error) = 0;
  };

} // namespace stato

