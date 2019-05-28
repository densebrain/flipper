/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.stato.testing;

import com.facebook.stato.core.StatoArray;
import com.facebook.stato.core.StatoConnection;
import com.facebook.stato.core.StatoObject;
import com.facebook.stato.core.StatoReceiver;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class StatoConnectionMock implements StatoConnection {
  public final Map<String, StatoReceiver> receivers = new HashMap<>();
  public final Map<String, List<Object>> sent = new HashMap<>();
  public final List<Throwable> errors = new ArrayList<>();

  @Override
  public void send(String method, StatoObject params) {
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
  public void send(String method, StatoArray params) {
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
  public void receive(String method, StatoReceiver receiver) {
    receivers.put(method, receiver);
  }
}
