//
// Created by Jonathan Glanz on 2019-06-02.
//

#pragma once

#include <stato/utils/Singleton.h>
#include <stato/StatoClientFactory.h>

namespace stato {
  using namespace utils;

  class StatoClientManager : public Singleton<StatoClientManager> {

    public:

    void setFactory(StatoClientFactory * factory);
    std::shared_ptr<StatoClient> getClient();

    private:
    friend Singleton;
    StatoClientManager();
    StatoClientFactory * factory {nullptr};
    std::shared_ptr<StatoClient> client {nullptr };
  };

}