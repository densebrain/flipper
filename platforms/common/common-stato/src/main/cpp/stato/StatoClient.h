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
#include <stato/StatoClientInit.h>
#include <stato/StatoPlugin.h>
#include <stato/StatoState.h>
#include <stato/StatoStep.h>
#include <stato-models/Envelope.pb.h>

namespace stato {

  class StatoClient {
    public:
    /**
     Call before accessing instance with StatoClient::instance(). This will set
     up all the state needed to establish a Stato connection.
     */
    virtual void init(StatoClientInit config) = 0;


    virtual void start() = 0;

    virtual void stop() = 0;

    virtual void addPlugin(std::shared_ptr<StatoPlugin> plugin) = 0;

    virtual void removePlugin(std::shared_ptr<StatoPlugin> plugin) = 0;

    virtual void refreshPlugins() = 0;

    virtual void setStateListener(
      std::shared_ptr<StatoStateUpdateListener> stateListener) = 0;

    virtual std::shared_ptr<StatoPlugin> getPlugin(const std::string &identifier) = 0;

    virtual std::string getState() = 0;

    virtual std::vector<StateElement> getStateElements() = 0;

    template<typename P>
    std::shared_ptr<P> getPlugin(const std::string &identifier) {
      return std::static_pointer_cast<P>(getPlugin(identifier));
    }

    virtual bool hasPlugin(const std::string &identifier) = 0;
    virtual void performAndReportError(const std::function<void()> &func) = 0;

  };

} // namespace stato

