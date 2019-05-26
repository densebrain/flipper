/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include <States/StatesConnectionManagerImpl.h>
#include <StatesTestLib/ConnectionContextStoreMock.h>
#include <folly/Singleton.h>

#include <gtest/gtest.h>

namespace facebook {
namespace states {
namespace test {

using folly::EventBase;

class StatesConnectionManagerImplTerminationTest : public ::testing::Test {
protected:
  std::shared_ptr<StatesState> state;
  std::shared_ptr<ConnectionContextStore> contextStore;
  void SetUp() override {
    // Folly singletons must be registered before they are used.
    // Without this, test fails in phabricator.
    folly::SingletonVault::singleton()->registrationComplete();
    state = std::make_shared<StatesState>();
    contextStore = std::make_shared<ConnectionContextStoreMock>();
  }
};

TEST_F(StatesConnectionManagerImplTerminationTest, testNullEventBaseGetsRejected) {
  try {
    auto instance = std::make_shared<StatesConnectionManagerImpl>(StatesInitConfig {
      DeviceData {},
      nullptr,
      new EventBase()
    },
    state,
    contextStore
    );
    FAIL();
  } catch (std::invalid_argument& e) {
    // Pass test
  }
  try {
    auto instance = std::make_shared<StatesConnectionManagerImpl>(StatesInitConfig {
      DeviceData {},
      new EventBase(),
      nullptr
    },
    state,
    contextStore
    );
    FAIL();
  } catch (std::invalid_argument& e) {
    // Pass test
  }
}

TEST_F(StatesConnectionManagerImplTerminationTest, testNonStartedEventBaseDoesntHang) {
  auto config = StatesInitConfig {
    DeviceData {},
    new EventBase(),
    new EventBase()
  };
  auto instance = std::make_shared<StatesConnectionManagerImpl>(config, state, contextStore);
  instance->start();
}

TEST_F(StatesConnectionManagerImplTerminationTest, testStartedEventBaseDoesntHang) {
  auto statesEventBase = new EventBase();
  auto connectionEventBase = new EventBase();
  auto statesThread = std::thread([statesEventBase](){
    statesEventBase->loopForever();
  });
  auto connectionThread = std::thread([connectionEventBase](){
    connectionEventBase->loopForever();
  });
  auto config = StatesInitConfig {
    DeviceData {},
    statesEventBase,
    connectionEventBase
  };
  auto instance = std::make_shared<StatesConnectionManagerImpl>(config, state, contextStore);

  instance->start();

  statesEventBase->terminateLoopSoon();
  connectionEventBase->terminateLoopSoon();

  statesThread.join();
  connectionThread.join();
}

} // namespace test
} // namespace states
} // namespace facebook
