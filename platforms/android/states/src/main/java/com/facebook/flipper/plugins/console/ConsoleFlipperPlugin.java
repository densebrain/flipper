/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.states.plugins.console;

import com.facebook.states.core.StatesConnection;
import com.facebook.states.core.StatesPlugin;
import com.facebook.states.plugins.console.iface.ConsoleCommandReceiver;

public class ConsoleStatesPlugin implements StatesPlugin {

  private final JavascriptEnvironment mJavascriptEnvironment;
  private JavascriptSession mJavascriptSession;

  public ConsoleStatesPlugin(JavascriptEnvironment jsEnvironment) {
    this.mJavascriptEnvironment = jsEnvironment;
  }

  @Override
  public String getId() {
    return "@states/plugin-console";
  }

  @Override
  public void onConnect(StatesConnection connection) throws Exception {
    ConsoleCommandReceiver.listenForCommands(connection, mJavascriptEnvironment);
  }

  public void onDisconnect() throws Exception {}

  @Override
  public boolean runInBackground() {
    return false;
  }
}
