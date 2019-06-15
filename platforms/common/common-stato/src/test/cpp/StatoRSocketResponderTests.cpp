/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include <Stato/StatoRSocketResponder.h>
#include <Stato/Log.h>
#include <StatoTestLib/StatoConnectionManagerMock.h>
#include <folly/json.h>
#include <gtest/gtest.h>

namespace facebook {
namespace stato {
namespace test {

using folly::dynamic;

class Callbacks
    : public facebook::stato::StatoConnectionManager::Callbacks {
 public:
  void onConnected() {}
  void onDisconnected() {}
  void onMessageReceived(
      const folly::dynamic& message,
      std::unique_ptr<StatoResponder> responder) {
    message_ = message;
    responder_ = std::move(responder);
  }
  folly::dynamic message_;
  std::unique_ptr<StatoResponder> responder_;
};

TEST(StatoRSocketResponderTests, testFireAndForgetWithoutIdParam) {
  auto socket = facebook::stato::test::StatoConnectionManagerMock();
  auto callbacks = new Callbacks();
  socket.setCallbacks(callbacks);
  folly::EventBase* eb = new folly::EventBase();
  auto responder = facebook::stato::StatoRSocketResponder(&socket, eb);
  dynamic d = dynamic::object("my", "message");
  auto json = folly::toJson(d);

  responder.handleFireAndForget(rsocket::Payload(json), rsocket::StreamId(1));
  EXPECT_EQ(socket.messagesReceived.size(), 1);
  EXPECT_EQ(socket.messagesReceived[0]["my"], "message");
  EXPECT_EQ(socket.respondersReceived, 0);
}

TEST(StatoRSocketResponderTests, testFireAndForgetWithIdParam) {
  auto socket = facebook::stato::test::StatoConnectionManagerMock();
  auto callbacks = new Callbacks();
  socket.setCallbacks(callbacks);
  folly::EventBase* eb = new folly::EventBase();
  auto responder = facebook::stato::StatoRSocketResponder(&socket, eb);
  dynamic d = dynamic::object("my", "message")("id", 7);
  auto json = folly::toJson(d);

  responder.handleFireAndForget(rsocket::Payload(json), rsocket::StreamId(1));
  EXPECT_EQ(socket.messagesReceived.size(), 1);
  EXPECT_EQ(socket.messagesReceived[0]["my"], "message");
  EXPECT_EQ(socket.messagesReceived[0]["id"], 7);
  EXPECT_EQ(socket.respondersReceived, 1);
}

} // namespace test
} // namespace stato
} // namespace facebook
