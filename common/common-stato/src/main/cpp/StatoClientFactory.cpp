//
// Created by Jonathan Glanz on 2019-06-02.
//

#include <stato/StatoClientFactory.h>
#include <stato/StatoDefaultClient.h>

namespace stato {
  StatoClientFactory::~StatoClientFactory() {
  }

  std::shared_ptr<StatoClient> StatoDefaultClientFactory::getClient() {
    static auto client = std::make_shared<StatoDefaultClient>();
    return client;
  }

}
