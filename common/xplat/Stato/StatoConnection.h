/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

#pragma once

#include "StatoResponder.h"
#include <folly/json.h>
#include <functional>
#include <string>

namespace facebook {
namespace stato {

/**
Represents a connection between the Desktop and mobile plugins
with corresponding identifiers.
*/
class StatoConnection {
 public:
  using StatoReceiver = std::function<
      void(const folly::dynamic&, std::shared_ptr<StatoResponder>)>;

  virtual ~StatoConnection() {}

  /**
  Invoke a method on the Stato desktop plugin with with a matching identifier.
  */
  virtual void send(
      const std::string& method,
      const folly::dynamic& params) = 0;

  /**
  Report an error to the Stato desktop app
  */
  virtual void error(
      const std::string& message,
      const std::string& stacktrace) = 0;

  /**
  Register a receiver to be notified of incoming calls of the given
  method from the Stato desktop plugin with a matching identifier.
  */
  virtual void receive(
      const std::string& method,
      const StatoReceiver& receiver) = 0;
};

} // namespace stato
} // namespace facebook
