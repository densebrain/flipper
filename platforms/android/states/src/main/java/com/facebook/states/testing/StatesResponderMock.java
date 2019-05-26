/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.states.testing;

import com.facebook.states.core.StatesArray;
import com.facebook.states.core.StatesObject;
import com.facebook.states.core.StatesResponder;
import java.util.LinkedList;
import java.util.List;

public class StatesResponderMock implements StatesResponder {
  public final List<Object> successes = new LinkedList<>();
  public final List<StatesObject> errors = new LinkedList<>();

  @Override
  public void success(StatesObject response) {
    successes.add(response);
  }

  @Override
  public void success(StatesArray response) {
    successes.add(response);
  }

  @Override
  public void success() {
    successes.add(new StatesObject.Builder().build());
  }

  @Override
  public void error(StatesObject response) {
    errors.add(response);
  }
}
