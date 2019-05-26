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

class StatesStep;
class StatesStateUpdateListener;

namespace facebook {
namespace states {

enum State { success, in_progress, failed };

class StateElement {
public:
  StateElement(std::string name, State state): name_(name), state_(state) {};
  std::string name_;
  State state_;
};

}
}

class StatesState {
  friend StatesStep;

 public:
  StatesState();
  void setUpdateListener(std::shared_ptr<StatesStateUpdateListener>);
  std::string getState();
  std::vector<facebook::states::StateElement> getStateElements();

  /* To record a state update, call start() with the name of the step to get a
   StatesStep object. Call complete on this to register it successful,
   the absense of the completion call when it is destructed will register as a
   step failure. */
  std::shared_ptr<StatesStep> start(std::string step);

 private:
  void success(std::string);
  void failed(std::string, std::string);
  void started(std::string);

  std::shared_ptr<StatesStateUpdateListener> mListener = nullptr;
  std::string logs;
  std::vector<std::string> insertOrder;
  std::map<std::string, facebook::states::State> stateMap;
};
