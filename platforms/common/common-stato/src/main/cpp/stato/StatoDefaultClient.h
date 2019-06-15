/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include <map>
#include <mutex>
#include <vector>
#include <utility>
#include <functional>
#include <memory>

#include <stato/StatoMessageListenerRegistry.h>
#include <stato/StatoDefaultPluginConnection.h>
#include <stato/StatoPluginConnection.h>
#include <stato/StatoDefaultConnection.h>
#include <stato/StatoClientInit.h>
#include <stato/StatoPlugin.h>
#include <stato/StatoState.h>
#include <stato/StatoStep.h>
#include <stato/StatoClient.h>

namespace stato {

  template<typename T>
  using StatoMessagePayloadListener = std::function<void(
    const PayloadType payloadType,
    const T & payloadMessage,
    const Envelope &envelope,
    const EnvelopePayload &payload,
    std::unique_ptr<StatoResponder> responder
  )>;

  class StatoDefaultClient : public StatoClient, public StatoConnection::Callbacks {
    public:
    /**
     Call before accessing instance with StatoClient::instance(). This will set
     up all the state needed to establish a Stato connection.
     */
    void init(StatoClientInit config) override;

    /**
     Only public for testing
     */
    StatoDefaultClient();
    ~StatoDefaultClient() override = default;

    void start() override;

    void stop() override;


    void onConnected(const StatoConnection * conn) override;

    void onDisconnected(const StatoConnection * conn) override;

    //void onMessageReceived(
    //  PayloadType payloadType,
    //  const Envelope &envelope,
    //  const EnvelopePayload &message,
    //  std::unique_ptr<StatoResponder> responder
    //) override;

    void addPlugin(std::shared_ptr<StatoPlugin> plugin) override;

    void removePlugin(std::shared_ptr<StatoPlugin> plugin) override;

    void refreshPlugins() override;

    void setStateListener(
      std::shared_ptr<StatoStateUpdateListener> stateListener) override;

    std::shared_ptr<StatoPlugin> getPlugin(const std::string &identifier) override;

    std::string getState() override;

    std::vector<StateElement> getStateElements() override;


#pragma clang diagnostic push
#pragma ide diagnostic ignored "InfiniteRecursion"
    template<typename P>
    std::shared_ptr<P> getPlugin(const std::string &identifier) {
      return std::static_pointer_cast<P>(getPlugin(identifier));
    }
#pragma clang diagnostic pop


    /**
     * Client has plugin
     *
     * @param identifier
     * @return
     */
    bool hasPlugin(const std::string &identifier) override;

    /**
     * Execute lambda and report error on failure
     *
     * @param func
     */
    void performAndReportError(const std::function<void()> &func) override;

    private:
    std::atomic_bool connected = false;

    std::shared_ptr<StatoState> state;
    std::unique_ptr<StatoDefaultConnection> conn;

    std::map<std::string, std::shared_ptr<StatoPlugin>> plugins{};
    std::map<std::string, std::shared_ptr<StatoDefaultPluginConnection>> pluginConnections{};

    std::recursive_mutex mutex {};


    /**
   * Set the active plugin
   *
   * @param id - of plugin to activate
   */
    void setActivePlugin(const std::string & id);

    /**
     * Handle request to list plugins
     *
     * @param payloadType
     * @param payloadMessage
     * @param envelope
     * @param payload
     * @param responder
     */
    void handlePluginList(
      const PayloadType payloadType,
      const PluginListResponse & payloadMessage,
      const Envelope &envelope,
      const EnvelopePayload &payload,
      std::unique_ptr<StatoResponder> responder
    );

    /**
     * Set active plugin
     *
     * @param type
     * @param payloadMessage
     * @param envelope
     * @param payload
     * @param responder
     */
    void handlePluginSetActive(
      const PayloadType type,
      const PluginSetActiveRequestResponse &payloadMessage,
      const Envelope &envelope,
      const EnvelopePayload &payload,
      std::unique_ptr<StatoResponder> responder
    );

    /**
     * Call plugin
     *
     * @param type
     * @param payloadMessage
     * @param envelope
     * @param payload
     * @param responder
     */
    void handlePluginCall(
      const PayloadType type,
      const PluginCallRequestResponse &payloadMessage,
      const Envelope &envelope,
      const EnvelopePayload &payload,
      std::unique_ptr<StatoResponder> responder
    );

    /**
     * Handle supported plugin check
     *
     * @param type
     * @param payloadMessage
     * @param envelope
     * @param payload
     * @param responder
     */
    void handlePluginSupported(
      const PayloadType type,
      const PluginSupportedRequestResponse &payloadMessage,
      const Envelope &envelope,
      const EnvelopePayload &payload,
      std::unique_ptr<StatoResponder> responder
    );

    /**
     * Handle error inbound
     *
     * @param e
     */
    void handleError(std::exception &e);

    /**
     * Register a message handler
     *
     * @tparam T
     * @param type
     * @param listener
     */
    template<typename T>
    void registerHandler(PayloadType type, StatoMessagePayloadListener<T> listener) {
      auto reg = StatoMessageListenerRegistry::get();
      reg->addMessageListener(type, std::make_shared<StatoMessageListener>([this, listener](
        const PayloadType payloadType,
        const Envelope &envelope,
        const EnvelopePayload &payload,
        std::unique_ptr<StatoResponder> responder
      ) {
        T payloadMessage;
        JsonStringToMessage(payload.body(),&payloadMessage);
        listener(payloadType, payloadMessage, envelope, payload, std::move(responder));
      }));
    };


    /**
     * Disconnect plugin
     *
     * @param plugin
     */
    void disconnect(std::shared_ptr<StatoPlugin> plugin);

    /**
     * Start all background connections
     */
    void startBackgroundPlugins();


  };

} // namespace stato

