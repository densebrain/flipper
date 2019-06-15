/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include <stato-private/StatoDefaultRSocketResponder.h>
#include <folly/json.h>
#include <rsocket/RSocket.h>
#include <stato-private/FireAndForgetBasedStatoResponder.h>
#include <stato/StatoDefaultConnection.h>
#include <stato-private/StatoDefaultResponder.h>
#include <stato/StatoRequestResponse.h>
#include <stato/Log.h>

using folly::dynamic;


namespace stato {

  using namespace logger;


  void StatoDefaultRSocketResponder::handleFireAndForget(
    rsocket::Payload request,
    rsocket::StreamId streamId
  ) {
    //const auto messageStr = request.moveDataToString();


    std::unique_ptr<StatoResponder> responder;
    auto envelope = payloadToEnvelope(request);//folly::parseJson(messageStr);
    debugStream() << "Received message fireAndForget: " << PayloadType_Name(envelope.payload().type());

    //auto method = message["method"].getString();
    auto payloadType = envelope.payload().type();
    auto requestId = envelope.request_id();

    if (requestId.empty()) {
      responder = std::make_unique<FireAndForgetBasedStatoResponder>(connection, requestId, payloadType);
    }

    //auto payloadStr = message["payload"].getString();
    //auto payload = folly::parseJson(payloadStr);

    connection->onMessageReceived(payloadType, envelope, envelope.payload(), std::move(responder));
  }


  std::shared_ptr<yarpl::single::Single<rsocket::Payload>>
  StatoDefaultRSocketResponder::handleRequestResponse(
    rsocket::Payload request,
    rsocket::StreamId streamId
  ) {
    std::unique_ptr<StatoResponder> responder;
    auto envelope = payloadToEnvelope(request);
    debugStream() << "Received message requestResponse: " << PayloadType_Name(envelope.payload().type());

    auto payloadType = envelope.payload().type();
    const auto& requestId = envelope.request_id();

    auto dynamicSingle = yarpl::single::Single<const Envelope &>::create(
      [envelope,requestId,payloadType, this](auto observer) {
        debugStream() << "Passing to requestResponse handler";
        auto responder = std::make_unique<StatoDefaultResponder>(envelope, envelope.payload(), observer);
        connection->onMessageReceived(
          payloadType,
          envelope,
          envelope.payload(),
          std::unique_ptr<StatoDefaultResponder>(responder.get())
        );
        responder.release();
      });

    auto rsocketSingle = yarpl::single::Single<rsocket::Payload>::create(
      [dynamicSingle, envelope,requestId,payloadType,this](auto observer) {
        observer->onSubscribe(yarpl::single::SingleSubscriptions::empty());
        dynamicSingle->subscribe(
          [observer, envelope,requestId,payloadType,this](const Envelope & result) {
            eventBase->runInEventBaseThread([observer, envelope,requestId,payloadType, result, this]() {
              try {
                observer->onSuccess(
                  toRSocketPayload(
                    connection,
                    result
                  ));
              } catch (std::exception &e) {
                errorStream() << "Error responding: " << e.what();
                observer->onError(e);
              }
            });
          },
          [observer, this](folly::exception_wrapper e) {
            eventBase->runInEventBaseThread(
              [observer, e]() { observer->onError(e); });
          });
      });

    return rsocketSingle;
  }

} // namespace stato

