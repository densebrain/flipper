#include <utility>

/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

#pragma once

#include <memory>
#include <string>
#include <vector>
#include <map>



namespace stato {

  class StatoStep;
  class StatoStateUpdateListener;


  enum State {
    success, in_progress, failed
  };

  class StateElement {
    public:
    StateElement(std::string name, State state) : name(std::move(name)), state(state) {};
    std::string name;
    State state;
  };


  class StatoState {
    friend StatoStep;

    public:
    StatoState();
    void setUpdateListener(std::shared_ptr<StatoStateUpdateListener>);
    std::string getState();
    std::vector<stato::StateElement> getStateElements();

    /* To record a state update, call start() with the name of the step to get a
     StatoStep object. Call complete on this to register it successful,
     the absense of the completion call when it is destructed will register as a
     step failure. */
    std::shared_ptr<StatoStep> start(std::string step);

    private:
    void success(const std::string&);
    void failed(const std::string&, const std::string&);
    void started(const std::string&);

    std::shared_ptr<StatoStateUpdateListener> listener = nullptr;
    std::string logs;
    std::vector<std::string> insertOrder;
    std::map<std::string, stato::State> stateMap;
  };
}