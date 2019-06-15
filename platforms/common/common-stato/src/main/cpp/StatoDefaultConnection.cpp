/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */

#include <stdexcept>
#include <thread>
#include <algorithm>
#include <utility>

#include <folly/String.h>
#include <folly/futures/Future.h>
#include <folly/io/async/AsyncSocketException.h>
#include <folly/io/async/SSLContext.h>
#include <folly/json.h>

#include <rsocket/Payload.h>
#include <rsocket/RSocket.h>
#include <rsocket/transports/tcp/TcpConnectionFactory.h>
#include <yarpl/Single.h>

#include <google/protobuf/util/json_util.h>


#include <stato-models/PayloadType.pb.h>

#include <stato-private/FireAndForgetBasedStatoResponder.h>
#include <stato-private/StatoDefaultRSocketResponder.h>
#include <stato-private/StatoDefaultResponder.h>

#include <stato/utils/Macros.h>
#include <stato/utils/CallstackHelper.h>
#include <stato/StatoConnectionContextStore.h>
#include <stato/StatoStep.h>
#include <stato/StatoConnection.h>
#include <stato/StatoDefaultConnection.h>
#include <stato/StatoDisposable.h>
#include <stato/StatoMessageListenerRegistry.h>
#include <stato/Log.h>


#define WRONG_THREAD_EXIT_MSG \
  "ERROR: Aborting stato initialization because it's not running in the stato thread."

static constexpr int reconnectIntervalSeconds = 2;
static constexpr int connectionKeepaliveSeconds = 10;


// Not a public-facing version number.
// Used for compatibility checking with desktop stato.
// To be bumped for every core platform interface change.
static constexpr int sdkVersion = 2;

namespace stato {

  using namespace utils;
  using namespace logger;
  using namespace models;
  using namespace google::protobuf;
  using namespace google::protobuf::util;

  //Envelope payloadToEnvelope(const std::string & data) {
  //  Envelope envelope;
  //  assert(envelope.ParseFromString(data));
  //  return envelope;
  //  //auto message = folly::parseJson(json);
  //
  //  //return {
  //  //  .requestId = message.getDefault("requestId", "").asString(),
  //  //  .method = message.getDefault("message", "").asString(),
  //  //  .appToken = message.getDefault("appToken", "").asString(),
  //  //  .appPackage = message.getDefault("appPackage", "").asString(),
  //  //  .connectionId = message.getDefault("connectionId", "").asString(),
  //  //  .isError = message.getDefault("isError", false).asBool(),
  //  //  .isResponse = message.getDefault("isResponse", false).asBool(),
  //  //  .payload = folly::parseJson(message.getDefault("payload", "{}").asString())
  //  //};
  //}

  //
  //void setPayloadRequest(EnvelopePayload & payload, const Message * msg) {
  //  payload.mutable_request()->PackFrom(*msg);
  //}
  //
  //void setPayloadResponse(EnvelopePayload & payload, const Message * msg) {
  //  payload.mutable_response()->PackFrom(*msg);
  //}
  //
  //std::string messageToJson(const Message & msg) {
  //  std::string json;
  //  MessageToJsonString(msg,&json);
  //  return std::move(json);
  //}
  //
  //Envelope createEnvelopeFromPayload(PayloadType type, const Message * requestMsg, const Message * responseMsg = nullptr, const Envelope * fromEnvelope = nullptr) {
  //  EnvelopePayload payload;
  //  payload.set_type(type);
  //
  //  if (requestMsg)
  //    setPayloadRequest(payload,requestMsg);
  //
  //  if (responseMsg)
  //    setPayloadResponse(payload, responseMsg);
  //
  //  Envelope envelope;
  //
  //}



  class ConnectionEvents : public rsocket::RSocketConnectionEvents {
  private:
    StatoConnection * conn;

  public:
    ConnectionEvents(StatoConnection * conn) : conn(conn) {}

    void onConnected() override {
      conn->setOpen(true);
      if (conn->isConnectionTrusted()) {
        conn->getCallbacks()->onConnected(conn);
      }
    }

    void onDisconnected(const folly::exception_wrapper &) override {
      if (!conn->isOpen())
        return;
      conn->setOpen(false);
      if (conn->isConnectionTrusted()) {
        conn->getCallbacks()->onDisconnected(conn);
      }
      conn->reconnect();
    }

    void onClosed(const folly::exception_wrapper &e) override {
      onDisconnected(e);
    }
  };

  StatoDefaultConnection::StatoDefaultConnection(
    const StatoClientInit &init,
    std::shared_ptr<StatoState> state,
    std::shared_ptr<StatoConnectionContextStore> contextStore
  ) : statoState(std::move(state)),
    init(init),
    statoEventBase(init.callbackWorker),
    connectionEventBase(init.connectionWorker),
    contextStore(std::move(contextStore)) {
    CHECK_THROW(init.callbackWorker, std::invalid_argument);
    CHECK_THROW(init.connectionWorker, std::invalid_argument);
  }


  StatoDefaultConnection::~StatoDefaultConnection() {
    stop();
  }

  void StatoDefaultConnection::start() {
    auto step = statoState->start("Start connection thread");

    folly::makeFuture().via(statoEventBase->getEventBase())
      .delayed(std::chrono::milliseconds(0))
      .thenValue([this, step](auto &&) {
        step->complete();
        this->startSync();
      });
  }

  void StatoDefaultConnection::startSync() {
    if (!isRunningInOwnThread()) {
      log(WRONG_THREAD_EXIT_MSG);
      return;
    }
    if (isOpen()) {
      log("Already connected");
      return;
    }
    bool isClientSetupStep = isCertificateExchangeNeeded();
    auto step = statoState->start(isClientSetupStep ? "Establish pre-setup connection"
                                                    : "Establish main connection");
    try {
      if (isClientSetupStep) {
        debugStream() << "Starting certificate exchange";
        doCertificateExchange();
      } else {
        connectSecurely();
      }
      step->complete();
    } catch (const folly::AsyncSocketException &e) {
      auto type = e.getType();
      if (type == folly::AsyncSocketException::NOT_OPEN ||
          type == folly::AsyncSocketException::NETWORK_ERROR) {
        // The expected code path when stato desktop is not running.
        // Don't count as a failed attempt, or it would invalidate the connection
        // files for no reason. On iOS devices, we can always connect to the local
        // port forwarding server even when it can't connect to stato. In that
        // case we get a Network error instead of a Port not open error, so we
        // treat them the same.
        step->fail("No route to stato found. Is stato desktop running? Retrying...");
      } else {
        if (type == folly::AsyncSocketException::SSL_ERROR) {
          std::string message = stringFromStream(e.what() << "\nMake sure the date and time of your device is up to date.");
          errorStream() << message;
          step->fail(message);
        } else {
          log(e.what());
          step->fail(e.what());
        }
        failedConnectionAttempts++;
      }
      reconnect();
    } catch (const std::exception &e) {
      log(e.what());
      step->fail(e.what());
      failedConnectionAttempts++;
      reconnect();
    }
  }

  void StatoDefaultConnection::doCertificateExchange() {
    rsocket::SetupParameters parameters("application/octet-stream", "application/octet-stream");
    folly::SocketAddress address;

    Envelope emptyEnvelope;

    parameters.payload = toRSocketPayload(this, emptyEnvelope);

    address.setFromHostPort(init.config.host(), static_cast<uint16_t>(init.config.insecure_port()));

//    std::shared_ptr<StatoConnection> thisPtr;
//    thisPtr.reset(this);

    auto connectingInsecurely = statoState->start("Connect insecurely");
    connectionIsTrusted = false;
    client =
      rsocket::RSocket::createConnectedClient(std::make_shared<rsocket::TcpConnectionFactory>(*connectionEventBase
          ->getEventBase(),
        std::move(address)),
        std::move(parameters),
        nullptr,
        std::chrono::seconds(connectionKeepaliveSeconds), // keepaliveInterval
        nullptr, // stats
        std::make_shared<ConnectionEvents>(this)).get();
    connectingInsecurely->complete();

    requestSignedCertFromStato();
  }

  void StatoDefaultConnection::connectSecurely() {
    folly::SocketAddress address;
    rsocket::SetupParameters parameters("application/octet-stream", "application/octet-stream");

    auto loadingDeviceId = statoState->start("Load Device Id");
    auto deviceId = contextStore->getDeviceId();
    if (deviceId.compare("unknown")) {
      loadingDeviceId->complete();
    }

//    auto &state = init.state;
//    std::string str;
//    MessageToJsonString(state, &str);

    Envelope emptyEnvelope;
    parameters.payload = toRSocketPayload(this, emptyEnvelope); //rsocket::Payload(str);

    address.setFromHostPort(init.config.host(), static_cast<uint16_t>(init.config.secure_port()));

    std::shared_ptr<folly::SSLContext> sslContext = contextStore->getSSLContext();
    auto connectingSecurely = statoState->start("Connect securely");
    connectionIsTrusted = true;
    client =
      rsocket::RSocket::createConnectedClient(
        std::make_shared<rsocket::TcpConnectionFactory>(
          *connectionEventBase->getEventBase(),
          std::move(address),
          std::move(sslContext)
        ),
        std::move(parameters),
        std::make_shared<StatoDefaultRSocketResponder>(this, connectionEventBase),
        std::chrono::seconds(connectionKeepaliveSeconds),
        nullptr, // stats
        std::make_shared<ConnectionEvents>(this)
      ).get();

    connectingSecurely->complete();
    failedConnectionAttempts = 0;
  }

  void StatoDefaultConnection::reconnect() {
    folly::makeFuture().via(statoEventBase->getEventBase())
      .delayed(std::chrono::seconds(reconnectIntervalSeconds))
      .thenValue([this](auto &&) { this->startSync(); });
  }

  void StatoDefaultConnection::stop() {
    if (client) {
      client->disconnect();
    }
    client = nullptr;
  }

  bool StatoDefaultConnection::isOpen() const {
    return open && connectionIsTrusted;
  }

  void StatoDefaultConnection::setCallbacks(Callbacks *callbacks) {
    this->callbacks = callbacks;
  }

  Envelope StatoDefaultConnection::toMessage(const Envelope &from) {
    Envelope to;
    to.CopyFrom(from);

    auto state = to.mutable_state();
    state->CopyFrom(init.state);
    pbPtrSet(state, connection_id, contextStore->getConnectionId());

    return std::move(to);
  }

  void StatoDefaultConnection::sendMessage(const Envelope &data) {
    auto message = toMessage(data);
    statoEventBase->add([this, message]() {
      try {
        rsocket::Payload payload = toRSocketPayload(this, message);
        if (client) {
          client->getRequester()->fireAndForget(std::move(payload))->subscribe([]() {
            debugStream() << "onFireAndForget";
          });
        }
      } catch (std::length_error &e) {
        // Skip sending messages that are too large.
        log(e.what());
        return;
      }
    });
  }

  void StatoDefaultConnection::onMessageReceived(
    const PayloadType payloadType,
    const Envelope &envelope,
    const EnvelopePayload &payload,
    std::unique_ptr<StatoResponder> responder
  ) {
    try {
      auto messageRegistry = StatoMessageListenerRegistry::get();
      messageRegistry->onMessageReceived(payloadType, envelope, payload, std::move(responder));
    } catch (std::exception &e) {
      log(std::string("Error: ") + e.what());
      if (responder) {
        ErrorRequestResponse error;
        std::string errorMsg = "Unknown error during " + PayloadType_Name(payloadType) +
                               ". ";// + messageToJson(envelope);

        error.set_message(errorMsg);
        error.set_stacktrace(getCallstack());
        error.set_name(errorMsg);
        responder->error(error);
      }
    } catch (...) {
      log("Unknown error suppressed in StatoClient");
      if (responder) {
        ErrorRequestResponse error;
        std::string errorMsg = "Unknown error during " + PayloadType_Name(payloadType) +
                               ". ";// + messageToJson(envelope.);
        error.set_message(errorMsg);
        error.set_stacktrace(getCallstack());
        error.set_name(errorMsg);

        responder->error(error);
      }
    }
  }

  bool StatoDefaultConnection::isCertificateExchangeNeeded() {
    if (failedConnectionAttempts >= 2) {
      return true;
    }

    auto step = statoState->start("Check required certificates are present");
    bool isContextReady = contextStore->isReady();
    if (isContextReady) {
      step->complete();
    }
    return !isContextReady;
  }

  const SDKState &StatoDefaultConnection::getSDKState() const {
    return init.state;
  }

  const SDKConfig &StatoDefaultConnection::getSDKConfig() const {
    return init.config;
  }

  void StatoDefaultConnection::requestSignedCertFromStato() {
    auto generatingCSR = statoState->start("Generate CSR");
    std::string csr = contextStore->getCertificateSigningRequest();
    generatingCSR->complete();

    CertificateExchangeRequest request;
    request.set_csr(csr);

    auto envelope = createEnvelopeFromPayload(PayloadTypeCertificateExchange, request);

    auto gettingCert = statoState->start("Getting cert from desktop");

    statoEventBase->add([this, envelope, gettingCert]() {
      client->getRequester()
        ->requestResponse(rsocket::Payload(toRSocketPayload(this, envelope)))
        ->subscribe([this, gettingCert](rsocket::Payload p) {

          Envelope resEnvelope;
          auto &buf = p.data;
          auto length = buf->length();
          resEnvelope.ParseFromArray(buf->data(), length);

//          auto resEnvelopeStr = p.data->buffer() //moveDataToString();
//          infoStream() << "Received cert exchange response: " << resEnvelopeStr;
//
//          auto resEnvelope = payloadToEnvelope(resEnvelopeStr);
          //id = envelope.connectionId;




          try {
            CertificateExchangeResponse response;
            JsonStringToMessage(resEnvelope.payload().body(), &response);

//            if (resEnvelope.payload().body().UnpackTo(&response))
//              throw std::domain_error("Unable to unpack cert response");

            contextStore->storeCertificates(response);
            log("Certificate exchange complete.");
          } catch (const std::exception &ex) {
            errorStream() << "Error during signing: " << ex.what();
          }
          //!payload.empty()) {
          //  contextStore_->storeConnectionConfig(config);
          //}
          gettingCert->complete();

          // Disconnect after message sending is complete.
          // This will trigger a reconnect which should use the secure
          // channel.
          // TODO: Connect immediately, without waiting for reconnect
          client = nullptr;
        }, [this, envelope, gettingCert](folly::exception_wrapper e) {
          e.handle([&](rsocket::ErrorWithPayload &errorWithPayload) {
            std::string errorMessage = errorWithPayload.payload.moveDataToString();

            auto
              errorMsg =
              stringFromStream("Desktop failed to provide certificates. Error from stato desktop:\n"
                << errorMessage);
            //auto error =
            //  "Desktop failed to provide certificates. Error from stato desktop:\n" +
            //    errorMessage;
            error(errorMsg);
            gettingCert->fail(errorMsg);
            client = nullptr;

          }, [e, gettingCert](...) {

            std::stringstream errorMsgStream;
            errorMsgStream << "Unable to exchange certs: " << e.what();

            const char *errorMsg = errorMsgStream.str().c_str();
            gettingCert->fail(errorMsg);
          });
        });
    });
    failedConnectionAttempts = 0;
  }

  //folly::dynamic StatoDefaultConnection::toMessage(const Envelope & envelope) {
  //  auto method = envelope.method.empty() ? "unknown" : envelope.method;
  //  auto requestId = envelope.requestId;
  //  auto message = folly::dynamic::object
  //    ("payload", folly::toJson(envelope.payload))
  //    ("method", method)
  //    ("nodeId", config.appSdkConfig.deviceId)
  //    ("connectionId", contextStore->getConnectionId())
  //    ("requestId", requestId)
  //    ("appPackage", config.appSdkConfig.appPackage)
  //    ("isError", envelope.isError)
  //    ("isResponse", envelope.isResponse);
  //
  //
  //  return std::move(message);
  //}
  //
  //void StatoDefaultConnection::sendLegacyCertificateRequest(folly::dynamic message) {
  //  // Desktop is using an old version of Stato.
  //  // Fall back to fireAndForget, instead of requestResponse.
  //  auto sendingRequest = statoState->start("Sending fallback certificate request");
  //  client->getRequester()
  //    ->fireAndForget(rsocket::Payload(folly::toJson(message)))
  //    ->subscribe([this, sendingRequest]() {
  //      sendingRequest->complete();
  //      folly::dynamic config = folly::dynamic::object();
  //      contextStore->storeConnectionConfig(config);
  //      client = nullptr;
  //    });
  //}

  bool StatoDefaultConnection::isRunningInOwnThread() {
    return statoEventBase->isInEventBaseThread();
  }

  bool StatoDefaultConnection::isConnectionTrusted() {
    return connectionIsTrusted;
  }

  StatoConnection::Callbacks *StatoDefaultConnection::getCallbacks() {
    return callbacks;
  }

  void StatoDefaultConnection::setOpen(bool open) {
    this->connectionIsTrusted = false;
    this->open = open;
  }

  bool StatoDefaultConnection::isOpen() {
    return open;
  }

//  std::vector<std::shared_ptr<StatoMessageListener>> & StatoDefaultConnection::getMessageListeners(PayloadType type) {
//    std::lock_guard<std::recursive_mutex> lock(listenerMutex);
//    if (listenerMap.find(type) == listenerMap.end()) {
//      listenerMap[type] = std::vector<std::shared_ptr<StatoMessageListener>>();
//    }
//
//    auto &listeners = listenerMap[type];
//
//    return listeners;
//  }
//
//  std::shared_ptr<StatoDisposer> StatoDefaultConnection::addMessageListener(PayloadType type, std::shared_ptr<StatoMessageListener> listener) {
//    {
//      auto & listeners = getMessageListeners(type);
//      std::lock_guard<std::recursive_mutex> lock(listenerMutex);
//      listeners.push_back(listener);
//    }
//    return std::make_shared<StatoDisposer>([this, type, listener]() {
//      std::lock_guard<std::recursive_mutex> lock(listenerMutex);
//      auto & listeners = this->listenerMap[type];
//      auto idx = std::find(listeners.begin(), listeners.end(), listener);
//      if (idx != listeners.end()) {
//        listeners.erase(idx);
//      }
//    });
//
//  }


} // namespace stato

