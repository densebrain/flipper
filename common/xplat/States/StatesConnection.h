/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

#pragma once

#include "StatesResponder.h"
#include <folly/json.h>
#include <functional>
#include <string>

namespace facebook {
namespace states {

/**
Represents a connection between the Desktop and mobile plugins
with corresponding identifiers.
*/
class StatesConnection {
 public:
  using StatesReceiver = std::function<
      void(const folly::dynamic&, std::shared_ptr<StatesResponder>)>;

  virtual ~StatesConnection() {}

  /**
  Invoke a method on the States desktop plugin with with a matching identifier.
  */
  virtual void send(
      const std::string& method,
      const folly::dynamic& params) = 0;

  /**
  Report an error to the States desktop app
  */
  virtual void error(
      const std::string& message,
      const std::string& stacktrace) = 0;

  /**
  Register a receiver to be notified of incoming calls of the given
  method from the States desktop plugin with a matching identifier.
  */
  virtual void receive(
      const std::string& method,
      const StatesReceiver& receiver) = 0;
};

} // namespace states
} // namespace facebook
