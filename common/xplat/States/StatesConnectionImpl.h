/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include <map>
#include <string>
#include "StatesConnection.h"
#include "StatesConnectionManager.h"
#include "Log.h"

namespace facebook {
namespace states {

class StatesConnectionImpl : public StatesConnection {
 public:
  StatesConnectionImpl(StatesConnectionManager* socket, const std::string& name)
      : socket_(socket), name_(name) {}

  void call(
      const std::string& method,
      const folly::dynamic& params,
      std::shared_ptr<StatesResponder> responder) {
    if (receivers_.find(method) == receivers_.end()) {
      std::string errorMessage = "Receiver " + method + " not found.";
      log("Error: " + errorMessage);
      responder->error(folly::dynamic::object("message", errorMessage));
      return;
    }
    receivers_.at(method)(params, responder);
  }

  void send(const std::string& method, const folly::dynamic& payload) override {
    folly::dynamic message = folly::dynamic::object("method", "execute")(
        "payload",
        folly::dynamic::object("api", name_)("type", method)("payload", payload));

    socket_->sendMessage(message);
  }

  void error(const std::string& message, const std::string& stacktrace)
      override {
    socket_->sendMessage(folly::dynamic::object(
        "error",
        folly::dynamic::object("message", message)("stacktrace", stacktrace)));
  }

  void receive(const std::string& method, const StatesReceiver& receiver)
      override {
    receivers_[method] = receiver;
  }

  /**
  Runtime check which receivers are supported for this app
  */
  bool hasReceiver(const std::string& method) {
    return receivers_.find(method) != receivers_.end();
  }

 private:
  StatesConnectionManager* socket_;
  std::string name_;
  std::map<std::string, StatesReceiver> receivers_;
};

} // namespace states
} // namespace facebook
