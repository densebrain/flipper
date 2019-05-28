/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package com.facebook.stato.plugins.leakcanary;

import android.util.Log;
import com.facebook.stato.core.StatoConnection;
import com.facebook.stato.core.StatoObject;
import com.facebook.stato.core.StatoPlugin;
import com.facebook.stato.core.StatoReceiver;
import com.facebook.stato.core.StatoResponder;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class LeakCanaryStatoPlugin implements StatoPlugin {

  private static final String TAG = "LeakCanaryStatoPlugin";

  private static final String REPORT_LEAK_EVENT = "reportLeak";
  private static final String CLEAR_EVENT = "clear";
  private static final String LEAKS_KEY = "leaks";

  private StatoConnection mConnection;

  private final List<String> leakList = new ArrayList<>();

  @Override
  public String getId() {
    return "@stato/plugin-leak-canary";
  }

  @Override
  public void onConnect(StatoConnection connection) {
    mConnection = connection;
    sendLeakList();

    mConnection.receive(
        CLEAR_EVENT,
        new StatoReceiver() {
          @Override
          public void onReceive(StatoObject params, StatoResponder responder) throws Exception {
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
        mConnection.send(REPORT_LEAK_EVENT, new StatoObject(obj));
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
