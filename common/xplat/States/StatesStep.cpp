/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include "StatesStep.h"
#include "StatesState.h"
#include "Log.h"

using facebook::states::log;

void StatesStep::complete() {
  isLogged = true;
  state->success(name);
}

void StatesStep::fail(std::string message) {
  isLogged = true;
  state->failed(name, message);
}

StatesStep::StatesStep(std::string step, StatesState* s) {
  state = s;
  name = step;
}

StatesStep::~StatesStep() {
  if (!isLogged) {
    try {
      state->failed(name, "");
    } catch (std::exception& e) {
      log(std::string("Exception occurred in StatesStep destructor: ") +
          e.what());
    } catch (...) {
      log("Exception occurred in StatesStep destructor");
    }
  }
}
