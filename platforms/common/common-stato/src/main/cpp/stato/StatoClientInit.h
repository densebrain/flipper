/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include <folly/io/async/EventBase.h>
#include <map>
#include <folly/dynamic.h>
#include <stato-models/SDKState.pb.h>
#include <stato/utils/Macros.h>
namespace stato {

  using namespace models;


  struct StatoClientInit {
    /**
    Map of client specific configuration data such as app name, device name, etc.
    */
    SDKState state {};

    SDKConfig config {};

    /**
    EventBase on which client callbacks should be called.
    */
    folly::EventBase *callbackWorker;

    /**
    EventBase to be used to maintain the network connection.
    */
    folly::EventBase *connectionWorker;

    StatoClientInit(const SDKState & fromState, const SDKConfig & fromConfig) {
      state.CopyFrom(fromState);
      config.CopyFrom(fromConfig);
    }
    //PROP_ACCESSOR_EX(int, insecure_port, this->config.insecure_port());

    //int insecurePort = 8089;
    //int securePort = 8088;
  };

} // namespace stato

