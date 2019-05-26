/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include "StatesResponder.h"
#include "StatesConnectionManager.h"
#include <folly/json.h>

namespace facebook {
namespace states {

/* Responder for responding to legacy states applications.
   Originally, states desktop used fireAndForget for all messages, so calling
   the SDK would send a fire and forget message, to which the SDK would respond
   with another one, with an id field that states uses to map it to the
   original request. This Responder should be used when such requests are
   received.
 */
class FireAndForgetBasedStatesResponder : public StatesResponder {
 public:
  FireAndForgetBasedStatesResponder(
      StatesConnectionManager* socket,
      int64_t responseID)
      : socket_(socket), responseID_(responseID) {}

  void success(const folly::dynamic& response) override {
    const folly::dynamic message =
        folly::dynamic::object("id", responseID_)("success", response);
    socket_->sendMessage(message);
  }

  void error(const folly::dynamic& response) override {
    const folly::dynamic message =
        folly::dynamic::object("id", responseID_)("error", response);
    socket_->sendMessage(message);
  }

 private:
  StatesConnectionManager* socket_;
  int64_t responseID_;
};

} // namespace states
} // namespace facebook
