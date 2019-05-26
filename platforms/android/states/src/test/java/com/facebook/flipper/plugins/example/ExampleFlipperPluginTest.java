/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.states.plugins.example;

import static org.hamcrest.CoreMatchers.hasItem;
import static org.hamcrest.MatcherAssert.assertThat;

import com.facebook.states.core.StatesObject;
import com.facebook.states.testing.StatesConnectionMock;
import com.facebook.states.testing.StatesResponderMock;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;

@RunWith(RobolectricTestRunner.class)
public class ExampleStatesPluginTest {

  @Test
  public void greetingTest() throws Exception {
    final ExampleStatesPlugin plugin = new ExampleStatesPlugin();
    final StatesConnectionMock connection = new StatesConnectionMock();
    final StatesResponderMock responder = new StatesResponderMock();

    plugin.onConnect(connection);
    connection
        .receivers
        .get("displayMessage")
        .onReceive(new StatesObject.Builder().put("message", "test").build(), responder);

    assertThat(
        responder.successes, hasItem(new StatesObject.Builder().put("greeting", "Hello").build()));
  }
}
