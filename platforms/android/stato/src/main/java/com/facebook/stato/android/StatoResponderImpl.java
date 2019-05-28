/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.stato.android;

import com.facebook.stato.BuildConfig;
import com.facebook.stato.core.StatoArray;
import com.facebook.stato.core.StatoObject;
import com.facebook.stato.core.StatoResponder;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;

@DoNotStrip
class StatoResponderImpl implements StatoResponder {
  static {
    if (BuildConfig.IS_INTERNAL_BUILD) {
      SoLoader.loadLibrary("stato");
    }
  }

  private final HybridData mHybridData;

  private StatoResponderImpl(HybridData hd) {
    mHybridData = hd;
  }

  @Override
  public void success(StatoObject params) {
    successObject(params);
  }

  @Override
  public void success(StatoArray params) {
    successArray(params);
  }

  @Override
  public void success() {
    successObject(new StatoObject.Builder().build());
  }

  public native void successObject(StatoObject response);

  public native void successArray(StatoArray response);

  @Override
  public native void error(StatoObject response);
}
