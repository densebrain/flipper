/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#include "StatoState.h"
#include "StatoStateUpdateListener.h"
#include "StatoStep.h"
#include <vector>

#if STATES_DEBUG_LOG
#include "Log.h"
#endif

using namespace facebook::stato;

/* Class responsible for collecting state updates and combining them into a
 * view of the current state of the stato client. */

StatoState::StatoState() : logs("") {}
void StatoState::setUpdateListener(
    std::shared_ptr<StatoStateUpdateListener> listener) {
  mListener = listener;
}

void StatoState::started(std::string step) {
#if STATES_DEBUG_LOG
  log("[started] " + step);
#endif
  if (stateMap.find(step) == stateMap.end()) {
    insertOrder.push_back(step);
  }
  stateMap[step] = State::in_progress;
  if (mListener) {
    mListener->onUpdate();
  }
}

void StatoState::success(std::string step) {
#if STATES_DEBUG_LOG
  log("[finished] " + step);
#endif
  logs = logs + "[Success] " + step + "\n";
  stateMap[step] = State::success;
  if (mListener) {
    mListener->onUpdate();
  }
}

void StatoState::failed(std::string step, std::string errorMessage) {
#if STATES_DEBUG_LOG
  log("[failed] " + step);
#endif
  logs = logs + "[Failed] " + step + ": " + errorMessage + "\n";
  stateMap[step] = State::failed;
  if (mListener) {
    mListener->onUpdate();
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
