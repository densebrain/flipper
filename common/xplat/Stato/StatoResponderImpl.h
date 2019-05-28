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
#include "StatoConnectionManager.h"
#include "StatoResponder.h"
#include "Log.h"

namespace facebook {
namespace stato {

/* Responder to encapsulate yarpl observables and hide them from stato core +
 * plugins */
class StatoResponderImpl : public StatoResponder {
 public:
  StatoResponderImpl(
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

  ~StatoResponderImpl() {
    if (!isCompleted) {
      try {
        downstreamObserver_->onSuccess(
            folly::dynamic::object("success", folly::dynamic::object()));
      } catch (std::exception& e) {
        log(std::string(
                "Exception occurred when responding in StatoResponder: ") +
            e.what());
      } catch (...) {
        log("Exception occurred when responding in StatoResponder");
      }
    }
  }

 private:
  std::shared_ptr<yarpl::single::SingleObserver<folly::dynamic>>
      downstreamObserver_;
  bool isCompleted = false;
};

} // namespace stato
} // namespace facebook
