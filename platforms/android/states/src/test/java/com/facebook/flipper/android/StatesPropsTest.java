/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.states.android;

import static org.junit.Assert.assertEquals;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;

@RunWith(RobolectricTestRunner.class)
public class StatesPropsTest {

  @Test
  public void shouldParseExpectedInput() throws Exception {
    int value1 = StatesProps.extractIntFromPropValue("1111,2222", 0, 1234);
    assertEquals(value1, 1111);
    int value2 = StatesProps.extractIntFromPropValue("1111,2222", 1, 1234);
    assertEquals(value2, 2222);
  }

  @Test
  public void shouldFallbackForTruncatedInput() throws Exception {
    int value = StatesProps.extractIntFromPropValue("1111", 1, 1234);
    assertEquals(value, 1234);
  }

  @Test
  public void shouldFallbackForMistypedInput() throws Exception {
    int value = StatesProps.extractIntFromPropValue("111ds1", 0, 1234);
    assertEquals(value, 1234);
  }

  @Test
  public void shouldFallbackForEmptyInput() throws Exception {
    int value = StatesProps.extractIntFromPropValue("", 0, 1234);
    assertEquals(value, 1234);
  }
}
