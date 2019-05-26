/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.states.plugins.react;

import androidx.annotation.Nullable;
import com.facebook.states.core.StatesConnection;
import com.facebook.states.core.StatesObject;
import com.facebook.states.core.StatesPlugin;
import com.facebook.states.core.StatesReceiver;
import com.facebook.states.core.StatesResponder;

public class ReactStatesPlugin implements StatesPlugin {

  public static final String ID = "React";
  @Nullable private StatesConnection mConnection;

  @Override
  public String getId() {
    return ID;
  }

  @Override
  public void onConnect(StatesConnection connection) {
    mConnection = connection;
    connection.receive(
        "config",
        new StatesReceiver() {
          @Override
          public void onReceive(final StatesObject params, StatesResponder responder) {
            // set received host and port in react-native
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
