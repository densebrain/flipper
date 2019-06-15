/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

#pragma once

#include <stato/StatoResponder.h>
#include <folly/json.h>
#include <functional>
#include <string>
//#include <StatoRequestResponse.h>
#include <stato-models/Envelope.pb.h>
#include <stato-models/Payload.pb.h>

namespace stato {
  using namespace models;
/**
Represents a connection between the Desktop and mobile plugins
with corresponding identifiers.
*/
  class StatoPluginConnection {
    public:
    using StatoReceiver = std::function<
      void(
        const std::string & pluginId,
        const std::string & apiMethod,
        std::shared_ptr<EnvelopePayload> requestResponse,
        std::shared_ptr<Envelope> envelope,
        std::shared_ptr<StatoResponder> responder
        //const folly::dynamic &, std::shared_ptr<StatoRequestResponse> requestResponse, std::shared_ptr<StatoResponder>
          )>;

    virtual ~StatoPluginConnection() {}


    /**
    Invoke a method on the Stato desktop plugin with with a matching identifier.
    */
    virtual void send(std::string method, const std::string & json) = 0;

    /**
    Report an error to the Stato desktop app
    */
    virtual void error(
      const std::string &message,
      const std::string &stacktrace
    ) = 0;

    /**
    Register a receiver to be notified of incoming calls of the given
    method from the Stato desktop plugin with a matching identifier.
    */
    virtual void receive(
      const std::string &method,
      const StatoReceiver &receiver
    ) = 0;
  };

} // namespace stato

