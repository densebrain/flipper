/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

#pragma once

class StatesStateUpdateListener {
 public:
  virtual ~StatesStateUpdateListener() = default;
  virtual void onUpdate() = 0;
};
