/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.states.plugins.example;

import android.app.Activity;
import android.widget.Toast;
import androidx.annotation.Nullable;
import com.facebook.states.core.StatesConnection;
import com.facebook.states.core.StatesObject;
import com.facebook.states.core.StatesPlugin;
import com.facebook.states.core.StatesReceiver;
import com.facebook.states.core.StatesResponder;

public class ExampleStatesPlugin implements StatesPlugin {

  public static final String ID = "@states/plugin-example";

  @Nullable private Activity mActivity;

  @Nullable private StatesConnection mConnection;

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
  public void onConnect(StatesConnection connection) {
    mConnection = connection;
    connection.receive(
        "displayMessage",
        new StatesReceiver() {
          @Override
          public void onReceive(final StatesObject params, StatesResponder responder) {
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

            responder.success(new StatesObject.Builder().put("greeting", "Hello").build());
          }
        });
  }

  public void triggerNotification() {
    if (mConnection != null) {
      mConnection.send(
          "triggerNotification", new StatesObject.Builder().put("id", mNotificationsSent).build());
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
