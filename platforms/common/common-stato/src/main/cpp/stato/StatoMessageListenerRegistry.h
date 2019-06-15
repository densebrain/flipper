//
// Created by Jonathan Glanz on 2019-06-14.
//

#pragma once

#include <stato-models/Envelope.pb.h>

#include <stato/utils/Singleton.h>
#include <stato/StatoResponder.h>
#include <stato/StatoResponder.h>
#include <stato/StatoDisposable.h>

namespace stato {

  using namespace utils;

  using StatoMessageListener = std::function<void(
    const PayloadType payloadType,
    const Envelope &envelope,
    const EnvelopePayload &payload,
    std::unique_ptr<StatoResponder> responder
  )>;

  class StatoMessageListenerRegistry : public Singleton<StatoMessageListenerRegistry> {
  public:
    ~StatoMessageListenerRegistry() = default;

    /**
     * Get current listeners
     *
     * @param type
     * @return
     */
    std::vector<std::shared_ptr<StatoMessageListener>> & getMessageListeners(PayloadType type);

    /**
     * Add a listener for a specific message type
     *
     * @param type
     * @param listener
     * @return
     */
    std::shared_ptr<StatoDisposer> addMessageListener(
      PayloadType type,
      std::shared_ptr<StatoMessageListener> listener
    );

    /**
     * Trigger listeners of a new message
     *
     * @param payloadType
     * @param envelope
     * @param payload
     * @param responder
     * @return
     */
    bool onMessageReceived(
      const PayloadType payloadType,
      const Envelope &envelope,
      const EnvelopePayload &payload,
      std::unique_ptr<StatoResponder> responder
    );


    void clearMessageListeners(const PayloadType type);

    void clearAllMessageListeners();

  private:
    friend Singleton;

    std::recursive_mutex listenerMutex {};
    std::map<PayloadType, std::vector<std::shared_ptr<StatoMessageListener>>> listenerMap {};

    StatoMessageListenerRegistry() = default;



  };
}
