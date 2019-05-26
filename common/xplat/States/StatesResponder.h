/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include <folly/json.h>

namespace facebook {
namespace states {

/**
 * StatesResponder is used to asynchronously respond to messages
 * received from the States desktop app.
 */
class StatesResponder {
 public:
  virtual ~StatesResponder(){};

  /**
   * Deliver a successful response to the States desktop app.
   */
  virtual void success(const folly::dynamic& response) = 0;

  /**
   * Inform the States desktop app of an error in handling the request.
   */
  virtual void error(const folly::dynamic& response) = 0;
};

} // namespace states
} // namespace facebook
