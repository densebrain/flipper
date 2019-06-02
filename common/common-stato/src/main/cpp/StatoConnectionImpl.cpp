/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include <stato/StatoConnectionImpl.h>
#include <folly/String.h>
#include <folly/futures/Future.h>
#include <folly/io/async/AsyncSocketException.h>
#include <folly/io/async/SSLContext.h>
#include <folly/json.h>
#include <rsocket/Payload.h>
#include <rsocket/RSocket.h>
#include <rsocket/transports/tcp/TcpConnectionFactory.h>
#include <stdexcept>
#include <thread>
#include <stato/ConnectionContextStore.h>
#include <stato/FireAndForgetBasedStatoResponder.h>
#include <stato/StatoRSocketResponder.h>
#include <stato/StatoResponderImpl.h>
#include <stato/StatoStep.h>
#include <stato/Log.h>
#include "yarpl/Single.h"

#define WRONG_THREAD_EXIT_MSG \
  "ERROR: Aborting stato initialization because it's not running in the stato thread."

static constexpr int reconnectIntervalSeconds = 2;
static constexpr int connectionKeepaliveSeconds = 10;

static constexpr int maxPayloadSize = 0xFFFFFF;

// Not a public-facing version number.
// Used for compatibility checking with desktop stato.
// To be bumped for every core platform interface change.
static constexpr int sdkVersion = 2;


namespace stato {


class ConnectionEvents : public rsocket::RSocketConnectionEvents {
 private:
  StatoConnectionImpl* websocket_;

 public:
  ConnectionEvents(StatoConnectionImpl* websocket)
      : websocket_(websocket) {}

  void onConnected() {
    websocket_->isOpen_ = true;
    if (websocket_->connectionIsTrusted_) {
      websocket_->callbacks_->onConnected();
    }
  }

  void onDisconnected(const folly::exception_wrapper&) {
    if (!websocket_->isOpen_)
      return;
    websocket_->isOpen_ = false;
    if (websocket_->connectionIsTrusted_) {
      websocket_->connectionIsTrusted_ = false;
      websocket_->callbacks_->onDisconnected();
    }
    websocket_->reconnect();
  }

  void onClosed(const folly::exception_wrapper& e) {
    onDisconnected(e);
  }
};

StatoConnectionImpl::StatoConnectionImpl(
    StatoClientConfig config,
    std::shared_ptr<StatoState> state,
    std::shared_ptr<ConnectionContextStore> contextStore)
    : deviceData_(config.deviceData),
      statoState_(state),
      insecurePort(config.insecurePort),
      securePort(config.securePort),
      statoEventBase_(config.callbackWorker),
      connectionEventBase_(config.connectionWorker),
      contextStore_(contextStore) {
  CHECK_THROW(config.callbackWorker, std::invalid_argument);
  CHECK_THROW(config.connectionWorker, std::invalid_argument);
}

StatoConnectionImpl::~StatoConnectionImpl() {
  stop();
}

void StatoConnectionImpl::start() {
  auto step = statoState_->start("Start connection thread");
  //auto self = this;

  folly::makeFuture()
      .via(statoEventBase_->getEventBase())
      .delayed(std::chrono::milliseconds(0))
      .thenValue([this, step](auto&&) {
        step->complete();
        this->startSync();
      });
}

void StatoConnectionImpl::startSync() {
  if (!isRunningInOwnThread()) {
    log(WRONG_THREAD_EXIT_MSG);
    return;
  }
  if (isOpen()) {
    log("Already connected");
    return;
  }
  bool isClientSetupStep = isCertificateExchangeNeeded();
  auto step = statoState_->start(
      isClientSetupStep ? "Establish pre-setup connection"
                        : "Establish main connection");
  try {
    if (isClientSetupStep) {
      doCertificateExchange();
    } else {
      connectSecurely();
    }
    step->complete();
  } catch (const folly::AsyncSocketException& e) {
    if (e.getType() == folly::AsyncSocketException::NOT_OPEN ||
        e.getType() == folly::AsyncSocketException::NETWORK_ERROR) {
      // The expected code path when stato desktop is not running.
      // Don't count as a failed attempt, or it would invalidate the connection
      // files for no reason. On iOS devices, we can always connect to the local
      // port forwarding server even when it can't connect to stato. In that
      // case we get a Network error instead of a Port not open error, so we
      // treat them the same.
      step->fail(
          "No route to stato found. Is stato desktop running? Retrying...");
    } else {
      if (e.getType() == folly::AsyncSocketException::SSL_ERROR) {
        auto message = std::string(e.what()) +
            "\nMake sure the date and time of your device is up to date.";
        log(message);
        step->fail(message);
      } else {
        log(e.what());
        step->fail(e.what());
      }
      failedConnectionAttempts_++;
    }
    reconnect();
  } catch (const std::exception& e) {
    log(e.what());
    step->fail(e.what());
    failedConnectionAttempts_++;
    reconnect();
  }
}

void StatoConnectionImpl::doCertificateExchange() {
  rsocket::SetupParameters parameters;
  folly::SocketAddress address;

  parameters.payload = rsocket::Payload(folly::toJson(folly::dynamic::object(
      "os", deviceData_.os)("device", deviceData_.device)(
      "app", deviceData_.app)("sdk_version", sdkVersion)));
  address.setFromHostPort(deviceData_.host, insecurePort);

  auto connectingInsecurely = statoState_->start("Connect insecurely");
  connectionIsTrusted_ = false;
  client_ =
      rsocket::RSocket::createConnectedClient(
          std::make_unique<rsocket::TcpConnectionFactory>(
              *connectionEventBase_->getEventBase(), std::move(address)),
          std::move(parameters),
          nullptr,
          std::chrono::seconds(connectionKeepaliveSeconds), // keepaliveInterval
          nullptr, // stats
          std::make_shared<ConnectionEvents>(this))
          .get();
  connectingInsecurely->complete();

  requestSignedCertFromStato();
}

void StatoConnectionImpl::connectSecurely() {
  rsocket::SetupParameters parameters;
  folly::SocketAddress address;

  auto loadingDeviceId = statoState_->start("Load Device Id");
  auto deviceId = contextStore_->getDeviceId();
  if (deviceId.compare("unknown")) {
    loadingDeviceId->complete();
  }
  parameters.payload = rsocket::Payload(
      folly::toJson(folly::dynamic::object("os", deviceData_.os)(
          "device", deviceData_.device)("device_id", deviceId)(
          "app", deviceData_.app)("sdk_version", sdkVersion)));
  address.setFromHostPort(deviceData_.host, securePort);

  std::shared_ptr<folly::SSLContext> sslContext =
      contextStore_->getSSLContext();
  auto connectingSecurely = statoState_->start("Connect securely");
  connectionIsTrusted_ = true;
  client_ =
      rsocket::RSocket::createConnectedClient(
          std::make_unique<rsocket::TcpConnectionFactory>(
              *connectionEventBase_->getEventBase(),
              std::move(address),
              std::move(sslContext)),
          std::move(parameters),
          std::make_shared<StatoRSocketResponder>(this, connectionEventBase_),
          std::chrono::seconds(connectionKeepaliveSeconds), // keepaliveInterval
          nullptr, // stats
          std::make_shared<ConnectionEvents>(this))
          .get();
  connectingSecurely->complete();
  failedConnectionAttempts_ = 0;
}

void StatoConnectionImpl::reconnect() {
  folly::makeFuture()
      .via(statoEventBase_->getEventBase())
      .delayed(std::chrono::seconds(reconnectIntervalSeconds))
      .thenValue([this](auto&&) { this->startSync(); });
}

void StatoConnectionImpl::stop() {
  if (client_) {
    client_->disconnect();
  }
  client_ = nullptr;
}

bool StatoConnectionImpl::isOpen() const {
  return isOpen_ && connectionIsTrusted_;
}

void StatoConnectionImpl::setCallbacks(Callbacks* callbacks) {
  callbacks_ = callbacks;
}

void StatoConnectionImpl::sendMessage(const folly::dynamic& message) {
  statoEventBase_->add([this, message]() {
    try {
      rsocket::Payload payload = toRSocketPayload(message);
      if (client_) {
        client_->getRequester()
            ->fireAndForget(std::move(payload))
            ->subscribe([]() {});
      }
    } catch (std::length_error& e) {
      // Skip sending messages that are too large.
      log(e.what());
      return;
    }
  });
}

void StatoConnectionImpl::onMessageReceived(
    const folly::dynamic& message,
    std::unique_ptr<StatoResponder> responder) {
  callbacks_->onMessageReceived(message, std::move(responder));
}

bool StatoConnectionImpl::isCertificateExchangeNeeded() {
  if (failedConnectionAttempts_ >= 2) {
    return true;
  }

  auto step = statoState_->start("Check required certificates are present");
  bool hasRequiredFiles = contextStore_->hasRequiredFiles();
  if (hasRequiredFiles) {
    step->complete();
  }
  return !hasRequiredFiles;
}

void StatoConnectionImpl::requestSignedCertFromStato() {
  auto generatingCSR = statoState_->start("Generate CSR");
  std::string csr = contextStore_->getCertificateSigningRequest();
  generatingCSR->complete();

  folly::dynamic message =
      folly::dynamic::object("method", "signCertificate")("csr", csr.c_str())(
          "destination", contextStore_->getCertificateDirectoryPath().c_str());
  auto gettingCert = statoState_->start("Getting cert from desktop");

  statoEventBase_->add([this, message, gettingCert]() {
    client_->getRequester()
        ->requestResponse(rsocket::Payload(folly::toJson(message)))
        ->subscribe(
            [this, gettingCert](rsocket::Payload p) {
              auto response = p.moveDataToString();
              if (!response.empty()) {
                folly::dynamic config = folly::parseJson(response);
                contextStore_->storeConnectionConfig(config);
              }
              gettingCert->complete();
              log("Certificate exchange complete.");
              // Disconnect after message sending is complete.
              // This will trigger a reconnect which should use the secure
              // channel.
              // TODO: Connect immediately, without waiting for reconnect
              client_ = nullptr;
            },
            [this, message, gettingCert](folly::exception_wrapper e) {
              e.handle(
                  [&](rsocket::ErrorWithPayload& errorWithPayload) {
                    std::string errorMessage =
                        errorWithPayload.payload.moveDataToString();

                    if (errorMessage.compare("not implemented")) {
                      auto error =
                          "Desktop failed to provide certificates. Error from stato desktop:\n" +
                          errorMessage;
                      log(error);
                      gettingCert->fail(error);
                      client_ = nullptr;
                    } else {
                      sendLegacyCertificateRequest(message);
                    }
                  },
                  [e, gettingCert](...) {
                    gettingCert->fail(e.what().c_str());
                  });
            });
  });
  failedConnectionAttempts_ = 0;
}

void StatoConnectionImpl::sendLegacyCertificateRequest(
    folly::dynamic message) {
  // Desktop is using an old version of Stato.
  // Fall back to fireAndForget, instead of requestResponse.
  auto sendingRequest =
      statoState_->start("Sending fallback certificate request");
  client_->getRequester()
      ->fireAndForget(rsocket::Payload(folly::toJson(message)))
      ->subscribe([this, sendingRequest]() {
        sendingRequest->complete();
        folly::dynamic config = folly::dynamic::object();
        contextStore_->storeConnectionConfig(config);
        client_ = nullptr;
      });
}

bool StatoConnectionImpl::isRunningInOwnThread() {
  return statoEventBase_->isInEventBaseThread();
}

rsocket::Payload toRSocketPayload(dynamic data) {
  std::string json = folly::toJson(data);
  rsocket::Payload payload = rsocket::Payload(json);
  auto payloadLength = payload.data->computeChainDataLength();
  if (payloadLength > maxPayloadSize) {
    auto logMessage =
        std::string(
            "Error: Skipping sending message larger than max rsocket payload: ") +
        json.substr(0, 100) + "...";
    log(logMessage);
    DCHECK_LE(payloadLength, maxPayloadSize);
    throw std::length_error(logMessage);
  }

  return payload;
}

} // namespace stato

