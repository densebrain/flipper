/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.plugins.common;

import org.stato.core.StatoObject;
import org.stato.core.StatoResponder;
import org.stato.testing.StatoResponderMock;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;

@RunWith(RobolectricTestRunner.class)
public class MainThreadStatoReceiverTest {

  StatoResponderMock responder;

  @Before
  public void setup() throws Exception {
    responder = new StatoResponderMock();
  }

  @Test
  public void errorIsPassedToResponder() throws Exception {
    MainThreadStatoReceiver receiver =
        new MainThreadStatoReceiver() {
          public void onReceiveOnMainThread(StatoObject params, StatoResponder responder)
              throws Exception {
            throw new RuntimeException("hello exception");
          }
        };

    receiver.onReceive(new StatoObject.Builder().build(), responder);

    Assert.assertEquals(1, responder.errors.size());
    StatoObject error = responder.errors.get(0);
    Assert.assertEquals("hello exception", error.getString("message"));
    Assert.assertEquals("java.lang.RuntimeException", error.getString("name"));
    Assert.assertTrue(
        error.getString("stacktrace").contains(MainThreadStatoReceiver.class.getCanonicalName()));
  }
}
