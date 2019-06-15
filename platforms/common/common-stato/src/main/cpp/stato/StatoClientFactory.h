//
// Created by Jonathan Glanz on 2019-06-02.
//

#pragma once

#include <stato/utils/Singleton.h>
#include <stato/StatoClient.h>

namespace stato {
  using namespace stato::utils;

  class StatoClientFactory {

    public:
    virtual  ~StatoClientFactory() = 0;
    virtual std::shared_ptr<StatoClient> getClient() = 0;

  };

  class StatoDefaultClientFactory : public StatoClientFactory {
    public:
    StatoDefaultClientFactory() {};
    std::shared_ptr<StatoClient> getClient() override;

  };
}


