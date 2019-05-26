/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include <States/StatesClient.h>
#include <StatesTestLib/StatesConnectionManagerMock.h>
#include <StatesTestLib/StatesPluginMock.h>
#include <StatesTestLib/StatesResponderMock.h>

#include <folly/json.h>
#include <gtest/gtest.h>

namespace facebook {
namespace states {
namespace test {

using folly::dynamic;

class StatesClientTest : public ::testing::Test {
 protected:
  std::unique_ptr<StatesClient> client;
  StatesConnectionManagerMock* socket;
  std::shared_ptr<StatesState> state;

  std::vector<folly::dynamic> successes;
  std::vector<folly::dynamic> failures;

  void SetUp() override {
    successes.clear();
    failures.clear();

    state.reset(new StatesState());

    socket = new StatesConnectionManagerMock;
    client = std::make_unique<StatesClient>(
        std::unique_ptr<StatesConnectionManagerMock>{socket}, state);
  }

  std::unique_ptr<StatesResponderMock> getResponder() {
    return std::make_unique<StatesResponderMock>(&successes, &failures);
  }
};

TEST_F(StatesClientTest, testSaneMocks) {
  StatesConnectionManagerMock socket;
  socket.start();
  EXPECT_TRUE(socket.isOpen());
  socket.stop();
  EXPECT_FALSE(socket.isOpen());

  StatesPluginMock plugin("Test");
  EXPECT_EQ(plugin.identifier(), "Test");
}

TEST_F(StatesClientTest, testGetPlugins) {
  client->start();

  client->addPlugin(std::make_shared<StatesPluginMock>("Cat"));
  client->addPlugin(std::make_shared<StatesPluginMock>("Dog"));

  dynamic message = dynamic::object("id", 1)("method", "getPlugins");
  socket->onMessageReceived(message, getResponder());

  dynamic expected = dynamic::object("plugins", dynamic::array("Cat", "Dog"));
  EXPECT_EQ(successes[0], expected);
  EXPECT_EQ(failures.size(), 0);
}

TEST_F(StatesClientTest, testGetPlugin) {
  const auto catPlugin = std::make_shared<StatesPluginMock>("Cat");
  client->addPlugin(catPlugin);
  const auto dogPlugin = std::make_shared<StatesPluginMock>("Dog");
  client->addPlugin(dogPlugin);

  EXPECT_EQ(catPlugin, client->getPlugin("Cat"));
  EXPECT_EQ(dogPlugin, client->getPlugin("Dog"));
}

TEST_F(StatesClientTest, testGetPluginWithDowncast) {
  const auto catPlugin = std::make_shared<StatesPluginMock>("Cat");
  client->addPlugin(catPlugin);
  EXPECT_EQ(catPlugin, client->getPlugin<StatesPluginMock>("Cat"));
}

TEST_F(StatesClientTest, testRemovePlugin) {
  client->start();

  auto plugin = std::make_shared<StatesPluginMock>("Test");
  client->addPlugin(plugin);
  client->removePlugin(plugin);

  dynamic message = dynamic::object("id", 1)("method", "getPlugins");
  auto responder = std::make_unique<StatesResponderMock>();
  socket->onMessageReceived(message, getResponder());

  dynamic expected = dynamic::object("plugins", dynamic::array());
  EXPECT_EQ(successes[0], expected);
  EXPECT_EQ(failures.size(), 0);
}

TEST_F(StatesClientTest, testStartStop) {
  client->start();
  EXPECT_TRUE(socket->isOpen());

  client->stop();
  EXPECT_FALSE(socket->isOpen());
}

TEST_F(StatesClientTest, testConnectDisconnect) {
  bool pluginConnected = false;
  const auto connectionCallback = [&](std::shared_ptr<StatesConnection> conn) {
    pluginConnected = true;
  };
  const auto disconnectionCallback = [&]() { pluginConnected = false; };
  auto plugin = std::make_shared<StatesPluginMock>(
      "Test", connectionCallback, disconnectionCallback);
  client->addPlugin(plugin);

  client->start();
  dynamic messageInit = dynamic::object("method", "init")(
      "params", dynamic::object("plugin", "Test"));
  auto responder = std::make_shared<StatesResponderMock>();
  socket->callbacks->onMessageReceived(messageInit, getResponder());
  EXPECT_TRUE(pluginConnected);

  client->stop();
  EXPECT_FALSE(pluginConnected);
}

TEST_F(StatesClientTest, testInitDeinit) {
  bool pluginConnected = false;
  const auto connectionCallback = [&](std::shared_ptr<StatesConnection> conn) {
    pluginConnected = true;
  };
  const auto disconnectionCallback = [&]() { pluginConnected = false; };
  auto plugin = std::make_shared<StatesPluginMock>(
      "Test", connectionCallback, disconnectionCallback);

  client->start();
  client->addPlugin(plugin);
  EXPECT_FALSE(pluginConnected);

  dynamic expected = dynamic::object("method", "refreshPlugins");
  EXPECT_EQ(socket->messages.front(), expected);

  {
    dynamic messageInit = dynamic::object("method", "init")(
        "params", dynamic::object("plugin", "Test"));
    auto responder = std::make_unique<StatesResponderMock>();
    socket->onMessageReceived(messageInit, getResponder());
    EXPECT_TRUE(pluginConnected);
  }

  {
    dynamic messageDeinit = dynamic::object("method", "deinit")(
        "params", dynamic::object("plugin", "Test"));
    auto responder = std::make_unique<StatesResponderMock>();
    socket->onMessageReceived(messageDeinit, getResponder());
    EXPECT_FALSE(pluginConnected);
  }

  {
    dynamic messageReinit = dynamic::object("method", "init")(
        "params", dynamic::object("plugin", "Test"));
    auto responder = std::make_unique<StatesResponderMock>();
    socket->onMessageReceived(messageReinit, getResponder());
    EXPECT_TRUE(pluginConnected);
  }

  client->stop();
  EXPECT_FALSE(pluginConnected);
}

TEST_F(StatesClientTest, testRemovePluginWhenConnected) {
  bool pluginConnected = false;
  const auto connectionCallback = [&](std::shared_ptr<StatesConnection> conn) {
    pluginConnected = true;
  };
  const auto disconnectionCallback = [&]() { pluginConnected = false; };
  auto plugin = std::make_shared<StatesPluginMock>(
      "Test", connectionCallback, disconnectionCallback);

  client->addPlugin(plugin);
  client->start();
  client->removePlugin(plugin);
  EXPECT_FALSE(pluginConnected);

  dynamic expected = dynamic::object("method", "refreshPlugins");
  EXPECT_EQ(socket->messages.back(), expected);
}

TEST_F(StatesClientTest, testUnhandleableMethod) {
  auto plugin = std::make_shared<StatesPluginMock>("Test");
  client->addPlugin(plugin);

  {
    dynamic messageInit = dynamic::object("method", "init")(
        "params", dynamic::object("plugin", "Test"));
    auto responder = std::make_unique<StatesResponderMock>();
    socket->onMessageReceived(messageInit, getResponder());
  }

  {
    dynamic messageExecute = dynamic::object("id", 1)("method", "unexpected");
    auto responder = std::make_unique<StatesResponderMock>();
    socket->onMessageReceived(messageExecute, getResponder());
  }

  dynamic expected =
      dynamic::object("message", "Received unknown method: unexpected");
  EXPECT_EQ(failures[0], expected);
  EXPECT_EQ(successes.size(), 0);
}

TEST_F(StatesClientTest, testExecute) {
  client->start();

  const auto connectionCallback = [](std::shared_ptr<StatesConnection> conn) {
    const auto receiver = [](const dynamic& params,
                             std::shared_ptr<StatesResponder> responder) {
      dynamic payload = dynamic::object("message", "yes_i_hear_u");
      responder->success(payload);
    };
    conn->receive("plugin_can_u_hear_me", receiver);
  };
  auto plugin = std::make_shared<StatesPluginMock>("Test", connectionCallback);
  client->addPlugin(plugin);

  {
    dynamic messageInit = dynamic::object("method", "init")(
        "params", dynamic::object("plugin", "Test"));
    auto responder = std::make_unique<StatesResponderMock>();
    socket->onMessageReceived(messageInit, getResponder());
  }

  {
    dynamic messageUnexpected = dynamic::object("id", 1)("method", "execute")(
        "params",
        dynamic::object("api", "Test")("method", "plugin_can_u_hear_me"));
    auto responder = std::make_shared<StatesResponderMock>();
    socket->callbacks->onMessageReceived(messageUnexpected, getResponder());
  }

  dynamic expected = dynamic::object("message", "yes_i_hear_u");
  EXPECT_EQ(successes[0], expected);
  EXPECT_EQ(failures.size(), 0);
}

TEST_F(StatesClientTest, testExecuteWithParams) {
  const auto connectionCallback = [&](std::shared_ptr<StatesConnection> conn) {
    const auto receiver = [](const dynamic& params,
                             std::shared_ptr<StatesResponder> responder) {
      const auto& first = params["first"].asString();
      const auto& second = params["second"].asString();
      std::map<std::string, std::string> m{{"dog", "woof"}, {"cat", "meow"}};
      dynamic payload = dynamic::object(first, m[first])(second, m[second]);
      responder->success(payload);
    };
    conn->receive("animal_sounds", receiver);
  };
  auto plugin = std::make_shared<StatesPluginMock>("Test", connectionCallback);
  client->addPlugin(plugin);

  {
    dynamic messageInit = dynamic::object("method", "init")(
        "params", dynamic::object("plugin", "Test"));
    auto responder = std::make_unique<StatesResponderMock>();
    socket->onMessageReceived(messageInit, getResponder());
  }

  {
    dynamic messageExecute = dynamic::object("id", 1)("method", "execute")(
        "params",
        dynamic::object("api", "Test")("method", "animal_sounds")(
            "params", dynamic::object("first", "dog")("second", "cat")));
    auto responder = std::make_unique<StatesResponderMock>();
    socket->onMessageReceived(messageExecute, getResponder());
  }

  dynamic expected = dynamic::object("dog", "woof")("cat", "meow");
  EXPECT_EQ(successes[0], expected);
  EXPECT_EQ(failures.size(), 0);
}

TEST_F(StatesClientTest, testExceptionUnknownPlugin) {
  client->start();

  dynamic messageInit = dynamic::object("method", "init")(
      "params", dynamic::object("plugin", "Unknown"));
  auto responder = std::make_unique<StatesResponderMock>();
  socket->onMessageReceived(messageInit, getResponder());

  auto failure = failures[0];
  EXPECT_EQ(failure["message"], "Plugin Unknown not found for method init");
  EXPECT_EQ(failure["name"], "PluginNotFound");
}

TEST_F(StatesClientTest, testExceptionUnknownApi) {
  client->start();

  dynamic messageInit = dynamic::object("method", "execute")(
      "params", dynamic::object("api", "Unknown"));
  auto responder = std::make_unique<StatesResponderMock>();
  socket->onMessageReceived(messageInit, getResponder());
  auto failure = failures[0];
  EXPECT_EQ(
      failure["message"], "Connection Unknown not found for method execute");
  EXPECT_EQ(failure["name"], "ConnectionNotFound");
}

TEST_F(StatesClientTest, testBackgroundPluginActivated) {
  bool pluginConnected = false;
  const auto connectionCallback = [&](std::shared_ptr<StatesConnection> conn) {
    pluginConnected = true;
  };
  const auto disconnectionCallback = [&]() { pluginConnected = false; };
  auto plugin = std::make_shared<StatesPluginMock>(
      "Test", connectionCallback, disconnectionCallback, true);

  client->addPlugin(plugin);
  client->start();
  EXPECT_TRUE(pluginConnected);
  client->stop();
  EXPECT_FALSE(pluginConnected);
}

TEST_F(StatesClientTest, testNonBackgroundPluginNotActivated) {
  bool pluginConnected = false;
  const auto connectionCallback = [&](std::shared_ptr<StatesConnection> conn) {
    pluginConnected = true;
  };
  const auto disconnectionCallback = [&]() { pluginConnected = false; };
  auto plugin = std::make_shared<StatesPluginMock>(
      "Test", connectionCallback, disconnectionCallback, false);

  client->addPlugin(plugin);
  client->start();
  EXPECT_FALSE(pluginConnected);
  client->stop();
  EXPECT_FALSE(pluginConnected);
}

TEST_F(StatesClientTest, testCrashInDidConnectDisConnectIsSuppressed) {
  const auto connectionCallback = [&](std::shared_ptr<StatesConnection> conn) {
    throw std::runtime_error("Runtime Error in test");
  };
  const auto disconnectionCallback = [&]() {
    throw std::runtime_error("Runtime Error in test");
  };
  auto plugin = std::make_shared<StatesPluginMock>(
      "Test", connectionCallback, disconnectionCallback, true);

  client->addPlugin(plugin);

  EXPECT_NO_FATAL_FAILURE(client->start());
  EXPECT_NO_FATAL_FAILURE(client->stop());
}

TEST_F(
    StatesClientTest,
    testNonStandardCrashInDidConnectDisConnectIsSuppressed) {
  const auto connectionCallback = [&](std::shared_ptr<StatesConnection> conn) {
    throw "Non standard exception";
  };
  const auto disconnectionCallback = [&]() { throw "Non standard exception"; };
  auto plugin = std::make_shared<StatesPluginMock>(
      "Test", connectionCallback, disconnectionCallback, true);

  client->addPlugin(plugin);

  EXPECT_NO_FATAL_FAILURE(client->start());
  EXPECT_NO_FATAL_FAILURE(client->stop());
}

} // namespace test
} // namespace states
} // namespace facebook
