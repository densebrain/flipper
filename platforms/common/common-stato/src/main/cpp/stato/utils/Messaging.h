
#pragma once



#include <utility>

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */

#include <rsocket/Payload.h>
#include <rsocket/RSocket.h>
#include <stato/Log.h>
#include <google/protobuf/util/json_util.h>
#include <yarpl/Single.h>
#include <stato/utils/Macros.h>
#include <stato-models/PayloadType.pb.h>
#include <stato-models/Payload.pb.h>
#include <stato-models/Envelope.pb.h>
#include <stato/StatoConnection.h>

namespace stato {

  using namespace logger;
  using namespace models;
  using namespace google::protobuf;
  using namespace google::protobuf::util;

  static constexpr int maxPayloadSize = 0xFFFFFF;

  template <typename T>
  T copyMessage(const T & from) {
    T to;
    to.CopyFrom(from);
    return std::move(to);
  }

  template <typename T>
  std::shared_ptr<T> copyMessageToSharedPtr(const T & from) {
    std::shared_ptr<T> to = std::make_shared<T>();

    to->CopyFrom(from);
    return std::move(to);
  }

  Envelope payloadToEnvelope(const rsocket::Payload & payload);

  rsocket::Payload toRSocketPayload(const StatoConnection * conn, const Envelope & envelope);

  void setPayloadBody(EnvelopePayload &payload, Message *msg);

  std::string messageToString(const Message &msg);

  std::string messageToJson(const Message &msg);

  Envelope createEnvelopeFromPayload(
    const PayloadType type,
    const Message & bodyMsg,
    Envelope *fromEnvelope = nullptr);





}