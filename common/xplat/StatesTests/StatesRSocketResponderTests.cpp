/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include <States/StatesRSocketResponder.h>
#include <States/Log.h>
#include <StatesTestLib/StatesConnectionManagerMock.h>
#include <folly/json.h>
#include <gtest/gtest.h>

namespace facebook {
namespace states {
namespace test {

using folly::dynamic;

class Callbacks
    : public facebook::states::StatesConnectionManager::Callbacks {
 public:
  void onConnected() {}
  void onDisconnected() {}
  void onMessageReceived(
      const folly::dynamic& message,
      std::unique_ptr<StatesResponder> responder) {
    message_ = message;
    responder_ = std::move(responder);
  }
  folly::dynamic message_;
  std::unique_ptr<StatesResponder> responder_;
};

TEST(StatesRSocketResponderTests, testFireAndForgetWithoutIdParam) {
  auto socket = facebook::states::test::StatesConnectionManagerMock();
  auto callbacks = new Callbacks();
  socket.setCallbacks(callbacks);
  folly::EventBase* eb = new folly::EventBase();
  auto responder = facebook::states::StatesRSocketResponder(&socket, eb);
  dynamic d = dynamic::object("my", "message");
  auto json = folly::toJson(d);

  responder.handleFireAndForget(rsocket::Payload(json), rsocket::StreamId(1));
  EXPECT_EQ(socket.messagesReceived.size(), 1);
  EXPECT_EQ(socket.messagesReceived[0]["my"], "message");
  EXPECT_EQ(socket.respondersReceived, 0);
}

TEST(StatesRSocketResponderTests, testFireAndForgetWithIdParam) {
  auto socket = facebook::states::test::StatesConnectionManagerMock();
  auto callbacks = new Callbacks();
  socket.setCallbacks(callbacks);
  folly::EventBase* eb = new folly::EventBase();
  auto responder = facebook::states::StatesRSocketResponder(&socket, eb);
  dynamic d = dynamic::object("my", "message")("id", 7);
  auto json = folly::toJson(d);

  responder.handleFireAndForget(rsocket::Payload(json), rsocket::StreamId(1));
  EXPECT_EQ(socket.messagesReceived.size(), 1);
  EXPECT_EQ(socket.messagesReceived[0]["my"], "message");
  EXPECT_EQ(socket.messagesReceived[0]["id"], 7);
  EXPECT_EQ(socket.respondersReceived, 1);
}

} // namespace test
} // namespace states
} // namespace facebook
