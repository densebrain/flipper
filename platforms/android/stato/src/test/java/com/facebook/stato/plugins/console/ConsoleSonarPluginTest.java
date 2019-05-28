/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.stato.plugins.console;

import static org.hamcrest.CoreMatchers.hasItem;
import static org.hamcrest.MatcherAssert.assertThat;

import com.facebook.stato.core.StatoObject;
import com.facebook.stato.testing.StatoConnectionMock;
import com.facebook.stato.testing.StatoResponderMock;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;

@RunWith(RobolectricTestRunner.class)
public class ConsoleSonarPluginTest {

  StatoConnectionMock connection;
  StatoResponderMock responder;

  @Before
  public void setup() throws Exception {
    JavascriptEnvironment jsEnvironment = new JavascriptEnvironment();
    final ConsoleStatoPlugin plugin = new ConsoleStatoPlugin(jsEnvironment);
    connection = new StatoConnectionMock();
    responder = new StatoResponderMock();
    plugin.onConnect(connection);
  }

  @Test
  public void simpleExpressionShouldEvaluateCorrectly() throws Exception {

    receiveScript("2 + 2");
    assertThat(
        responder.successes,
        hasItem(new StatoObject.Builder().put("value", 4).put("type", "json").build()));
  }

  private void receiveScript(String a) throws Exception {
    StatoObject getValue = new StatoObject.Builder().put("command", a).build();
    connection.receivers.get("executeCommand").onReceive(getValue, responder);
  }
}
