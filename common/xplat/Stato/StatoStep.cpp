/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include "StatoStep.h"
#include "StatoState.h"
#include "Log.h"

using facebook::stato::log;

void StatoStep::complete() {
  isLogged = true;
  state->success(name);
}

void StatoStep::fail(std::string message) {
  isLogged = true;
  state->failed(name, message);
}

StatoStep::StatoStep(std::string step, StatoState* s) {
  state = s;
  name = step;
}

StatoStep::~StatoStep() {
  if (!isLogged) {
    try {
      state->failed(name, "");
    } catch (std::exception& e) {
      log(std::string("Exception occurred in StatoStep destructor: ") +
          e.what());
    } catch (...) {
      log("Exception occurred in StatoStep destructor");
    }
  }
}
