/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package com.facebook.states.plugins.leakcanary;

import android.util.Log;
import com.facebook.states.core.StatesConnection;
import com.facebook.states.core.StatesObject;
import com.facebook.states.core.StatesPlugin;
import com.facebook.states.core.StatesReceiver;
import com.facebook.states.core.StatesResponder;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class LeakCanaryStatesPlugin implements StatesPlugin {

  private static final String TAG = "LeakCanaryStatesPlugin";

  private static final String REPORT_LEAK_EVENT = "reportLeak";
  private static final String CLEAR_EVENT = "clear";
  private static final String LEAKS_KEY = "leaks";

  private StatesConnection mConnection;

  private final List<String> leakList = new ArrayList<>();

  @Override
  public String getId() {
    return "@states/plugin-leak-canary";
  }

  @Override
  public void onConnect(StatesConnection connection) {
    mConnection = connection;
    sendLeakList();

    mConnection.receive(
        CLEAR_EVENT,
        new StatesReceiver() {
          @Override
          public void onReceive(StatesObject params, StatesResponder responder) throws Exception {
            leakList.clear();
          }
        });
  }

  @Override
  public void onDisconnect() throws Exception {
    mConnection = null;
  }

  @Override
  public boolean runInBackground() {
    return false;
  }

  private void sendLeakList() {
    if (mConnection != null) {
      JSONObject obj = new JSONObject();
      try {
        obj.put(LEAKS_KEY, new JSONArray(leakList));
        mConnection.send(REPORT_LEAK_EVENT, new StatesObject(obj));
      } catch (JSONException e) {
        Log.w(TAG, "Failure to serialize leak list: ", e);
      }
    }
  }

  public void reportLeak(String leakInfo) {
    leakList.add(leakInfo);
    sendLeakList();

  }
}
