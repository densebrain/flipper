/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.stato.plugins.console;

import com.facebook.stato.core.StatoConnection;
import com.facebook.stato.core.StatoPlugin;
import com.facebook.stato.plugins.console.iface.ConsoleCommandReceiver;

public class ConsoleStatoPlugin implements StatoPlugin {

  private final JavascriptEnvironment mJavascriptEnvironment;
  private JavascriptSession mJavascriptSession;

  public ConsoleStatoPlugin(JavascriptEnvironment jsEnvironment) {
    this.mJavascriptEnvironment = jsEnvironment;
  }

  @Override
  public String getId() {
    return "@stato/plugin-console";
  }

  @Override
  public void onConnect(StatoConnection connection) throws Exception {
    ConsoleCommandReceiver.listenForCommands(connection, mJavascriptEnvironment);
  }

  public void onDisconnect() throws Exception {}

  @Override
  public boolean runInBackground() {
    return false;
  }
}
