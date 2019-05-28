/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.stato.testing;

import com.facebook.stato.core.StatoArray;
import com.facebook.stato.core.StatoObject;
import com.facebook.stato.core.StatoResponder;
import java.util.LinkedList;
import java.util.List;

public class StatoResponderMock implements StatoResponder {
  public final List<Object> successes = new LinkedList<>();
  public final List<StatoObject> errors = new LinkedList<>();

  @Override
  public void success(StatoObject response) {
    successes.add(response);
  }

  @Override
  public void success(StatoArray response) {
    successes.add(response);
  }

  @Override
  public void success() {
    successes.add(new StatoObject.Builder().build());
  }

  @Override
  public void error(StatoObject response) {
    errors.add(response);
  }
}
