/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include <folly/io/async/EventBase.h>
#include <folly/json.h>
#include <rsocket/RSocketResponder.h>
#include "StatesConnectionManager.h"
#include "StatesResponder.h"
#include "Log.h"

namespace facebook {
namespace states {

/* Responder to encapsulate yarpl observables and hide them from states core +
 * plugins */
class StatesResponderImpl : public StatesResponder {
 public:
  StatesResponderImpl(
      std::shared_ptr<yarpl::single::SingleObserver<folly::dynamic>>
          downstreamObserver)
      : downstreamObserver_(downstreamObserver) {}

  void success(const folly::dynamic& response) override {
    const folly::dynamic message = folly::dynamic::object("success", response);
    isCompleted = true;
    downstreamObserver_->onSuccess(message);
  }

  void error(const folly::dynamic& response) override {
    const folly::dynamic message = folly::dynamic::object("error", response);
    isCompleted = true;
    downstreamObserver_->onSuccess(message);
  }

  ~StatesResponderImpl() {
    if (!isCompleted) {
      try {
        downstreamObserver_->onSuccess(
            folly::dynamic::object("success", folly::dynamic::object()));
      } catch (std::exception& e) {
        log(std::string(
                "Exception occurred when responding in StatesResponder: ") +
            e.what());
      } catch (...) {
        log("Exception occurred when responding in StatesResponder");
      }
    }
  }

 private:
  std::shared_ptr<yarpl::single::SingleObserver<folly::dynamic>>
      downstreamObserver_;
  bool isCompleted = false;
};

} // namespace states
} // namespace facebook
