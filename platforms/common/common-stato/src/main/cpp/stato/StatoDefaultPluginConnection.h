#include <utility>

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include <map>
#include <string>
#include <stato/StatoPluginConnection.h>
#include <stato/StatoConnection.h>
#include <stato/Log.h>
#include <stato/StatoDefaultConnection.h>
#include <stato/utils/Messaging.h>
#include <stato-models/Payload.pb.h>

namespace stato {

  class StatoDefaultPluginConnection : public StatoPluginConnection {
    public:
    StatoDefaultPluginConnection(
      StatoDefaultConnection *conn,
      std::string pluginId
    ) : conn(conn), pluginId(std::move(pluginId)) {
      debugStream() << "Creating plugin connection: " << this->pluginId;
    }

//    bool isConnected()  {
//      return connected;
//    };
//
//
//    /**
//     Returns true if the plugin is meant to be run in background too, otherwise it returns false.
//     */
//    bool runInBackground() override {
//      return true
//    };


    void call(
      const std::string &apiMethod,
      std::shared_ptr<EnvelopePayload> envelopePayload,
      std::shared_ptr<Envelope> envelope,
      std::shared_ptr<StatoResponder> responder
    ) {


      if (receivers.find(apiMethod) == receivers.end()) {
        std::string errorMessage = "Receiver " + apiMethod + " not found.";
        errorStream() << "Error: " << errorMessage;
        ErrorRequestResponse error;
        error.set_message(errorMessage);
        error.set_name(errorMessage);

        responder->error(error);
        return;
      }

      receivers.at(apiMethod)(this->pluginId, apiMethod, envelopePayload, envelope, responder);
    }

    void send(std::string method, const std::string &json) override {

      Envelope newEnvelope; //= copyMessage(envelope);
      auto payload = newEnvelope.mutable_payload();
      payload->set_type(PayloadTypePluginCall);

      PluginCallRequestResponse requestResponse;
      requestResponse.set_body(json);
      requestResponse.set_plugin_id(pluginId);
      requestResponse.set_method(method);

      payload->set_body(messageToJson(requestResponse));

      conn->sendMessage(newEnvelope);
      //  {
      //  .method = "execute",
      //  .payload = folly::dynamic::object("api", name_)("type", method)("payload", payload)
      //});
    };

    void error(const std::string &message, const std::string &stacktrace) override {

      Envelope newEnvelope;
      ErrorRequestResponse error;
      error.set_message(message);
      error.set_stacktrace(stacktrace);
      error.set_name(message);

      newEnvelope.mutable_payload()->set_body(messageToJson(error));

      conn->sendMessage(newEnvelope);
    };

    void receive(const std::string &method, const StatoReceiver &receiver) override {
      // receivers_.insert(method, receiver);// = receiver;
      receivers[method] = receiver; // = receiver;
    };

    /**
    Runtime check which receivers are supported for this app
    */
    bool hasReceiver(const std::string &method) {
      return receivers.find(method) != receivers.end();
    }

    private:
    StatoDefaultConnection *conn;
    std::string pluginId;
    std::map<std::string, StatoReceiver> receivers;
  };

} // namespace stato

