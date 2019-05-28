/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.stato.plugins.example;

import static org.hamcrest.CoreMatchers.hasItem;
import static org.hamcrest.MatcherAssert.assertThat;

import com.facebook.stato.core.StatoObject;
import com.facebook.stato.testing.StatoConnectionMock;
import com.facebook.stato.testing.StatoResponderMock;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;

@RunWith(RobolectricTestRunner.class)
public class ExampleStatoPluginTest {

  @Test
  public void greetingTest() throws Exception {
    final ExampleStatoPlugin plugin = new ExampleStatoPlugin();
    final StatoConnectionMock connection = new StatoConnectionMock();
    final StatoResponderMock responder = new StatoResponderMock();

    plugin.onConnect(connection);
    connection
        .receivers
        .get("displayMessage")
        .onReceive(new StatoObject.Builder().put("message", "test").build(), responder);

    assertThat(
        responder.successes, hasItem(new StatoObject.Builder().put("greeting", "Hello").build()));
  }
}
