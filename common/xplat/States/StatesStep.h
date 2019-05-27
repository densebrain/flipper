/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

#pragma once

#include <string>

class StatesState;

class StatesStep {
 public:
  /* Mark this step as completed successfully
   * failing to call complete() will be registered as a failure
   * when the destructor is executed. */
  void complete();

  // Mark the step as failed, and provide a message.
  void fail(std::string message);

  StatesStep(std::string name, StatesState* state);
  ~StatesStep();

 private:
  std::string name;
  bool isLogged = false;
  StatesState* state;
};