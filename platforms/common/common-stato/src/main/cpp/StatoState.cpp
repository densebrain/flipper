#include <utility>

/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#include <stato/StatoState.h>
#include <stato/StatoStateUpdateListener.h>
#include <stato/StatoStep.h>
#include <vector>

#if STATO_DEBUG_LOG
#include <stato/Log.h>
#endif



/* Class responsible for collecting state updates and combining them into a
 * view of the current state of the stato client. */
namespace stato {
  StatoState::StatoState() : logs("") {}

  void StatoState::setUpdateListener(
    std::shared_ptr<StatoStateUpdateListener> listener) {
    this->listener = std::move(listener);
  }

  void StatoState::started(const std::string& step) {
#if STATO_DEBUG_LOG
    log("[started] " + step);
#endif
    if (stateMap.find(step) == stateMap.end()) {
      insertOrder.push_back(step);
    }
    stateMap[step] = State::in_progress;
    if (listener) {
      listener->onUpdate();
    }
  }

  void StatoState::success(const std::string& step) {
#if STATO_DEBUG_LOG
    log("[finished] " + step);
#endif
    logs = logs + "[Success] " + step + "\n";
    stateMap[step] = State::success;
    if (listener) {
      listener->onUpdate();
    }
  }

  void StatoState::failed(const std::string& step, const std::string& errorMessage) {
#if STATO_DEBUG_LOG
    log("[failed] " + step);
#endif
    logs = logs + "[Failed] " + step + ": " + errorMessage + "\n";
    stateMap[step] = State::failed;
    if (listener) {
      listener->onUpdate();
    }
  }

// TODO: Currently returns string, but should really provide a better
// representation of the current state so the UI can show it in a more intuitive
// way
  std::string StatoState::getState() {
    return logs;
  }

  std::vector<StateElement> StatoState::getStateElements() {
    std::vector<StateElement> v;
    for (auto stepName : insertOrder) {
      v.push_back(StateElement(stepName, stateMap[stepName]));
    }
    return v;
  }

  std::shared_ptr<StatoStep> StatoState::start(std::string step_name) {
    started(step_name);
    return std::make_shared<StatoStep>(step_name, this);
  }
}