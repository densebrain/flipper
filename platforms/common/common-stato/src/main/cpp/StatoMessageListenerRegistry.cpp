//
// Created by Jonathan Glanz on 2019-06-14.
//

#include <stato/StatoMessageListenerRegistry.h>

namespace stato {


  bool
  StatoMessageListenerRegistry::onMessageReceived(
    const PayloadType payloadType,
    const Envelope &envelope,
    const EnvelopePayload &payload,
    std::unique_ptr<StatoResponder> responder
  ) {

    std::lock_guard<std::recursive_mutex> lock(listenerMutex);
    auto & listeners = getMessageListeners(payloadType);

    for (auto & listener : listeners) {
      (*(listener.get()))(payloadType,envelope,payload, std::move(responder));
    }
    return false;
  }

  std::shared_ptr<StatoDisposer> StatoMessageListenerRegistry::addMessageListener(
    PayloadType type,
    std::shared_ptr<StatoMessageListener> listener
  ) {
    {
      auto & listeners = getMessageListeners(type);
      std::lock_guard<std::recursive_mutex> lock(listenerMutex);
      listeners.push_back(listener);
    }


    return std::make_shared<StatoDisposer>([this, type, listener]() {
      std::lock_guard<std::recursive_mutex> lock(listenerMutex);
      auto & listeners = this->listenerMap[type];
      auto idx = std::find(listeners.begin(), listeners.end(), listener);
      if (idx != listeners.end()) {
        listeners.erase(idx);
      }
    });
  }

  std::vector<std::shared_ptr<StatoMessageListener>> & StatoMessageListenerRegistry::getMessageListeners(PayloadType type) {
    std::lock_guard<std::recursive_mutex> lock(listenerMutex);
    if (listenerMap.find(type) == listenerMap.end()) {
      listenerMap[type] = std::vector<std::shared_ptr<StatoMessageListener>>();
    }

    return listenerMap[type];;
  }

  void StatoMessageListenerRegistry::clearMessageListeners(const PayloadType type) {
    std::lock_guard<std::recursive_mutex> lock(listenerMutex);
    listenerMap[type] = std::vector<std::shared_ptr<StatoMessageListener>>();
  }

  void StatoMessageListenerRegistry::clearAllMessageListeners() {
    std::lock_guard<std::recursive_mutex> lock(listenerMutex);
    listenerMap = {};
  }

}