#include <utility>

//
// Created by Jonathan Glanz on 2019-06-02.
//

#include <stato/StatoClientManager.h>


namespace stato {
  StatoClientManager::StatoClientManager() {
    this->factory = new StatoDefaultClientFactory;
  }

  void StatoClientManager::setFactory(StatoClientFactory * factory) {
    this->factory = std::move(factory);
  }

  std::shared_ptr<StatoClient> StatoClientManager::getClient() {
    return factory->getClient();
  }
}
