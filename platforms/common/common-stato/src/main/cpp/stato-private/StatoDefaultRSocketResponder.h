/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include <rsocket/RSocketResponder.h>


namespace stato {

  class StatoDefaultConnection;

  class StatoDefaultRSocketResponder : public rsocket::RSocketResponder {
    private:
    StatoDefaultConnection *connection;
    folly::EventBase *eventBase;

    public:
    StatoDefaultRSocketResponder(
      StatoDefaultConnection *connection,
      folly::EventBase *eventBase
    ) : connection(connection), eventBase(eventBase) {};

    void handleFireAndForget(
      rsocket::Payload request,
      rsocket::StreamId streamId);

    std::shared_ptr<yarpl::single::Single<rsocket::Payload>> handleRequestResponse(rsocket::Payload request, rsocket::StreamId streamId);
  };

} // namespace stato

