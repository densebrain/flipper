/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.states.testing;

import com.facebook.states.core.StatesArray;
import com.facebook.states.core.StatesConnection;
import com.facebook.states.core.StatesObject;
import com.facebook.states.core.StatesReceiver;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class StatesConnectionMock implements StatesConnection {
  public final Map<String, StatesReceiver> receivers = new HashMap<>();
  public final Map<String, List<Object>> sent = new HashMap<>();
  public final List<Throwable> errors = new ArrayList<>();

  @Override
  public void send(String method, StatesObject params) {
    final List<Object> paramList;
    if (sent.containsKey(method)) {
      paramList = sent.get(method);
    } else {
      paramList = new ArrayList<>();
      sent.put(method, paramList);
    }

    paramList.add(params);
  }

  @Override
  public void send(String method, StatesArray params) {
    final List<Object> paramList;
    if (sent.containsKey(method)) {
      paramList = sent.get(method);
    } else {
      paramList = new ArrayList<>();
      sent.put(method, paramList);
    }

    paramList.add(params);
  }

  @Override
  public void reportError(Throwable throwable) {
    errors.add(throwable);
  }

  @Override
  public void receive(String method, StatesReceiver receiver) {
    receivers.put(method, receiver);
  }
}
