

#include <utility>

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include <stato/utils/Messaging.h>
#include <rsocket/Payload.h>
#include <rsocket/RSocket.h>
#include <stato/Log.h>
#include <google/protobuf/util/json_util.h>
#include <yarpl/Single.h>
#include <stato/utils/Macros.h>
#include <stato-models/PayloadType.pb.h>


namespace stato {

  using namespace logger;
  using namespace models;
  using namespace google::protobuf;
  using namespace google::protobuf::util;


  void setPayloadBody(EnvelopePayload &payload, Message *msg) {
    auto json = messageToJson(*msg);
    payload.set_body(json);
  }

  std::string messageToJson(const Message &msg) {
    std::string json;
    MessageToJsonString(msg, &json);
    return json;
  }

  std::unique_ptr<folly::IOBuf> messageToBuf(const Message &msg) {
    auto length = msg.ByteSizeLong();
    std::vector<uint8_t> buf(length);

    auto data = buf.data();
    msg.SerializeToArray(data, length);
    return std::move(folly::IOBuf::copyBuffer(data, length));
  }

  std::string messageToString(const Message &msg) {
    return msg.SerializeAsString();
  }

  Envelope createEnvelopeFromPayload(
    const PayloadType type,
    const Message &bodyMsg,
    Envelope *fromEnvelope
  ) {

    Envelope envelope;
    if (fromEnvelope)
      envelope.CopyFrom(*fromEnvelope);

    auto payload = envelope.mutable_payload();
    payload->set_type(type);

    auto json = messageToJson(bodyMsg);
    payload->set_body(json);




    return envelope;
  }

  rsocket::Payload toRSocketPayload(const StatoConnection *conn, const Envelope &envelope) {
    auto data = messageToBuf(envelope);
    auto md = messageToBuf(conn->getSDKState());
    debugStream() << "Encoded payload\ndata: " << data->length() << "\nmetadata: " << md->length();
    rsocket::Payload payload(std::move(data), std::move(md));

//    auto payloadLength = payload.data->computeChainDataLength();
//    if (payloadLength > maxPayloadSize) {
//      auto
//        logMessage =
//        std::string("Error: Skipping sending message larger than max rsocket payload");
//      log(logMessage);
//      DCHECK_LE(payloadLength, maxPayloadSize);
//      throw std::length_error(logMessage);
//    }

    return std::move(payload);
  }

  Envelope payloadToEnvelope(const rsocket::Payload &payload) {
    //auto message = folly::parseJson(json);
    Envelope envelope;
    auto &buf = payload.data;
    auto length = buf->length();
    envelope.ParseFromArray(buf->data(), length);


    //google::protobuf::util::JsonStringToMessage(json, &envelope);
    return std::move(envelope);
    //return {
    //  .requestId = message.getDefault("requestId", "").asString(),
    //  .method = message.getDefault("message", "").asString(),
    //  .appPackage = message.getDefault("appPackage", "").asString(),
    //  .connectionId = message.getDefault("connectionId", "").asString(),
    //  .isError = message.getDefault("isError", false).asBool(),
    //  .isResponse = message.getDefault("isResponse", false).asBool(),
    //  .payload = folly::parseJson(message.getDefault("payload", "{}").asString())
    //};
  }

  //Envelope copyEnvelope(const Envelope & from) {
  //  Envelope to
  //}
}