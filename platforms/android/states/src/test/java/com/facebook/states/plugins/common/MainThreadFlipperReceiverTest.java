/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.states.plugins.common;

import com.facebook.states.core.StatesObject;
import com.facebook.states.core.StatesResponder;
import com.facebook.states.testing.StatesResponderMock;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;

@RunWith(RobolectricTestRunner.class)
public class MainThreadStatesReceiverTest {

  StatesResponderMock responder;

  @Before
  public void setup() throws Exception {
    responder = new StatesResponderMock();
  }

  @Test
  public void errorIsPassedToResponder() throws Exception {
    MainThreadStatesReceiver receiver =
        new MainThreadStatesReceiver() {
          public void onReceiveOnMainThread(StatesObject params, StatesResponder responder)
              throws Exception {
            throw new RuntimeException("hello exception");
          }
        };

    receiver.onReceive(new StatesObject.Builder().build(), responder);

    Assert.assertEquals(1, responder.errors.size());
    StatesObject error = responder.errors.get(0);
    Assert.assertEquals("hello exception", error.getString("message"));
    Assert.assertEquals("java.lang.RuntimeException", error.getString("name"));
    Assert.assertTrue(
        error.getString("stacktrace").contains(MainThreadStatesReceiver.class.getCanonicalName()));
  }
}
