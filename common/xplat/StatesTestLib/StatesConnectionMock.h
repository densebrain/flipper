/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include <States/StatesConnection.h>
#include <map>
#include <queue>
#include <string>

namespace facebook {
namespace states {

class StatesConnectionMock : public StatesConnection {
 public:
  void send(const std::string& method, const folly::dynamic& params) override {
    sent_[method] = params;
    sent_message_history[method].push(params);
  }

  void receive(const std::string& method, const StatesReceiver& receiver)
      override {
    receivers_[method] = receiver;
  }

  void error(const std::string& message, const std::string& stacktrace)
      override {}

  std::map<std::string, folly::dynamic> sent_;
  std::map<std::string, StatesReceiver> receivers_;

  std::map<std::string, std::queue<folly::dynamic>> sent_message_history;
};

} // namespace states
} // namespace facebook
