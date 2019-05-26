/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.states.plugins.console;

import static org.hamcrest.CoreMatchers.hasItem;
import static org.hamcrest.MatcherAssert.assertThat;

import com.facebook.states.core.StatesObject;
import com.facebook.states.testing.StatesConnectionMock;
import com.facebook.states.testing.StatesResponderMock;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;

@RunWith(RobolectricTestRunner.class)
public class ConsoleSonarPluginTest {

  StatesConnectionMock connection;
  StatesResponderMock responder;

  @Before
  public void setup() throws Exception {
    JavascriptEnvironment jsEnvironment = new JavascriptEnvironment();
    final ConsoleStatesPlugin plugin = new ConsoleStatesPlugin(jsEnvironment);
    connection = new StatesConnectionMock();
    responder = new StatesResponderMock();
    plugin.onConnect(connection);
  }

  @Test
  public void simpleExpressionShouldEvaluateCorrectly() throws Exception {

    receiveScript("2 + 2");
    assertThat(
        responder.successes,
        hasItem(new StatesObject.Builder().put("value", 4).put("type", "json").build()));
  }

  private void receiveScript(String a) throws Exception {
    StatesObject getValue = new StatesObject.Builder().put("command", a).build();
    connection.receivers.get("executeCommand").onReceive(getValue, responder);
  }
}
