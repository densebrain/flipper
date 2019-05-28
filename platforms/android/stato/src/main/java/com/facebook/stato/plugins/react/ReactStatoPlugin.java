/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.stato.plugins.react;

import androidx.annotation.Nullable;
import com.facebook.stato.core.StatoConnection;
import com.facebook.stato.core.StatoObject;
import com.facebook.stato.core.StatoPlugin;
import com.facebook.stato.core.StatoReceiver;
import com.facebook.stato.core.StatoResponder;

public class ReactStatoPlugin implements StatoPlugin {

  public static final String ID = "React";
  @Nullable private StatoConnection mConnection;

  @Override
  public String getId() {
    return ID;
  }

  @Override
  public void onConnect(StatoConnection connection) {
    mConnection = connection;
    connection.receive(
        "config",
        new StatoReceiver() {
          @Override
          public void onReceive(final StatoObject params, StatoResponder responder) {
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
