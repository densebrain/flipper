/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.stato.plugins.example;

import android.app.Activity;
import android.widget.Toast;
import androidx.annotation.Nullable;
import com.facebook.stato.core.StatoConnection;
import com.facebook.stato.core.StatoObject;
import com.facebook.stato.core.StatoPlugin;
import com.facebook.stato.core.StatoReceiver;
import com.facebook.stato.core.StatoResponder;

public class ExampleStatoPlugin implements StatoPlugin {

  public static final String ID = "@stato/plugin-example";

  @Nullable private Activity mActivity;

  @Nullable private StatoConnection mConnection;

  private int mNotificationsSent = 0;

  @Override
  public String getId() {
    return ID;
  }

  /*
   * Activity to be used to display incoming messages
   */
  public void setActivity(Activity activity) {
    mActivity = activity;
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
  }

  public void triggerNotification() {
    if (mConnection != null) {
      mConnection.send(
          "triggerNotification", new StatoObject.Builder().put("id", mNotificationsSent).build());
      mNotificationsSent++;
    }
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
