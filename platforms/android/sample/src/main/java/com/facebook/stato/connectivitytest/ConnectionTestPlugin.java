/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.stato.connectivitytest;

import android.app.Activity;
import android.widget.Toast;
import androidx.annotation.Nullable;
import com.facebook.stato.core.StatoConnection;
import com.facebook.stato.core.StatoObject;
import com.facebook.stato.core.StatoPlugin;
import com.facebook.stato.core.StatoReceiver;
import com.facebook.stato.core.StatoResponder;
import com.facebook.stato.sample.ExampleActions;

public class ConnectionTestPlugin implements StatoPlugin {

  // We are reusing the existing "Example" logic here. That's generally a pretty bad idea,
  // but in war and in testing everything is fair.
  private static final String ID = "Example";

  private final Activity mActivity;

  @Nullable private StatoConnection mConnection;

  public ConnectionTestPlugin(Activity activity) {
    mActivity = activity;
  }

  @Override
  public String getId() {
    return ID;
  }

  @Override
  public void onConnect(StatoConnection connection) {
    mConnection = connection;
    connection.receive(
        "displayMessage",
        new StatoReceiver() {
          @Override
          public void onReceive(final StatoObject params, StatoResponder responder) {
            if (mActivity != null) {
              mActivity.runOnUiThread(
                  new Runnable() {
                    @Override
                    public void run() {
                      Toast.makeText(mActivity, params.getString("message"), Toast.LENGTH_SHORT)
                          .show();
                    }
                  });
            }

            responder.success(new StatoObject.Builder().put("greeting", "Hello").build());
          }
        });

    mActivity.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            ExampleActions.sendGetRequest();
            ExampleActions.sendPostRequest();
            // We want Stato to properly disconnect at this point and actually shut down the app.
            mActivity.finish();
            android.os.Process.sendSignal(android.os.Process.myPid(), 15);
          }
        });
  }

  @Override
  public void onDisconnect() {
    mConnection = null;
  }

  @Override
  public boolean runInBackground() {
    return true;
  }
}
