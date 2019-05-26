/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include <States/StatesConnectionManager.h>

namespace facebook {
namespace states {
namespace test {

class StatesConnectionManagerMock : public StatesConnectionManager {
 public:
  StatesConnectionManagerMock() : callbacks(nullptr) {}

  void start() override {
    open = true;
    if (callbacks) {
      callbacks->onConnected();
    }
  }

  void stop() override {
    open = false;
    if (callbacks) {
      callbacks->onDisconnected();
    }
  }

  bool isOpen() const override {
    return open;
  }

  void sendMessage(const folly::dynamic& message) override {
    messages.push_back(message);
  }

  void onMessageReceived(
      const folly::dynamic& message,
      std::unique_ptr<StatesResponder> responder) override {
    if (responder) {
      respondersReceived++;
    }
    callbacks->onMessageReceived(message, std::move(responder));
    messagesReceived.push_back(message);
  }

  void setCallbacks(Callbacks* aCallbacks) override {
    callbacks = aCallbacks;
  }

 public:
  bool open = false;
  Callbacks* callbacks;
  std::vector<folly::dynamic> messages;
  std::vector<folly::dynamic> messagesReceived;
  int respondersReceived = 0;
};

} // namespace test
} // namespace states
} // namespace facebook
