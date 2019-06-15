/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include <Stato/StatoConnectionManagerImpl.h>
#include <StatoTestLib/ConnectionContextStoreMock.h>
#include <folly/Singleton.h>

#include <gtest/gtest.h>

namespace facebook {
namespace stato {
namespace test {

using folly::EventBase;

class StatoConnectionManagerImplTerminationTest : public ::testing::Test {
protected:
  std::shared_ptr<StatoState> state;
  std::shared_ptr<ConnectionContextStore> contextStore;
  void SetUp() override {
    // Folly singletons must be registered before they are used.
    // Without this, test fails in phabricator.
    folly::SingletonVault::singleton()->registrationComplete();
    state = std::make_shared<StatoState>();
    contextStore = std::make_shared<ConnectionContextStoreMock>();
  }
};

TEST_F(StatoConnectionManagerImplTerminationTest, testNullEventBaseGetsRejected) {
  try {
    auto instance = std::make_shared<StatoConnectionManagerImpl>(StatoInitConfig {
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
    auto instance = std::make_shared<StatoConnectionManagerImpl>(StatoInitConfig {
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

TEST_F(StatoConnectionManagerImplTerminationTest, testNonStartedEventBaseDoesntHang) {
  auto config = StatoInitConfig {
    DeviceData {},
    new EventBase(),
    new EventBase()
  };
  auto instance = std::make_shared<StatoConnectionManagerImpl>(config, state, contextStore);
  instance->start();
}

TEST_F(StatoConnectionManagerImplTerminationTest, testStartedEventBaseDoesntHang) {
  auto statoEventBase = new EventBase();
  auto connectionEventBase = new EventBase();
  auto statoThread = std::thread([statoEventBase](){
    statoEventBase->loopForever();
  });
  auto connectionThread = std::thread([connectionEventBase](){
    connectionEventBase->loopForever();
  });
  auto config = StatoInitConfig {
    DeviceData {},
    statoEventBase,
    connectionEventBase
  };
  auto instance = std::make_shared<StatoConnectionManagerImpl>(config, state, contextStore);

  instance->start();

  statoEventBase->terminateLoopSoon();
  connectionEventBase->terminateLoopSoon();

  statoThread.join();
  connectionThread.join();
}

} // namespace test
} // namespace stato
} // namespace facebook
