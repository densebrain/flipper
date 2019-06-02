/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include <stato/StatoRSocketResponder.h>
#include <folly/json.h>
#include <rsocket/RSocket.h>
#include <stato/FireAndForgetBasedStatoResponder.h>
#include <stato/StatoConnectionImpl.h>
#include <stato/StatoResponderImpl.h>
#include <stato/Log.h>

using folly::dynamic;


namespace stato {

rsocket::Payload toRSocketPayload(dynamic data);

void StatoRSocketResponder::handleFireAndForget(
    rsocket::Payload request,
    rsocket::StreamId streamId) {
  const auto payload = request.moveDataToString();
  std::unique_ptr<FireAndForgetBasedStatoResponder> responder;
  auto message = folly::parseJson(payload);
  if (message.find("id") != message.items().end()) {
    auto id = message["id"].getInt();
    responder =
        std::make_unique<FireAndForgetBasedStatoResponder>(websocket_, id);
  }

  websocket_->onMessageReceived(
      folly::parseJson(payload), std::move(responder));
}

std::shared_ptr<yarpl::single::Single<rsocket::Payload>>
StatoRSocketResponder::handleRequestResponse(
    rsocket::Payload request,
    rsocket::StreamId streamId) {
  const auto requestString = request.moveDataToString();

  auto dynamicSingle = yarpl::single::Single<folly::dynamic>::create(
      [payload = std::move(requestString), this](auto observer) {
        auto responder = std::make_unique<StatoResponderImpl>(observer);
        websocket_->onMessageReceived(
            folly::parseJson(payload), std::move(responder));
      });

  auto rsocketSingle = yarpl::single::Single<rsocket::Payload>::create(
      [payload = std::move(requestString), dynamicSingle, this](auto observer) {
        observer->onSubscribe(yarpl::single::SingleSubscriptions::empty());
        dynamicSingle->subscribe(
            [observer, this](folly::dynamic d) {
              eventBase_->runInEventBaseThread([observer, d]() {
                try {
                  observer->onSuccess(toRSocketPayload(d));

                } catch (std::exception& e) {
                  log(e.what());
                  observer->onError(e);
                }
              });
            },
            [observer, this](folly::exception_wrapper e) {
              eventBase_->runInEventBaseThread(
                  [observer, e]() { observer->onError(e); });
            });
      });

  return rsocketSingle;
}

} // namespace stato

