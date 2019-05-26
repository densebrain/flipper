/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.states.android;

import com.facebook.states.BuildConfig;
import com.facebook.states.core.StatesArray;
import com.facebook.states.core.StatesObject;
import com.facebook.states.core.StatesResponder;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;

@DoNotStrip
class StatesResponderImpl implements StatesResponder {
  static {
    if (BuildConfig.IS_INTERNAL_BUILD) {
      SoLoader.loadLibrary("states");
    }
  }

  private final HybridData mHybridData;

  private StatesResponderImpl(HybridData hd) {
    mHybridData = hd;
  }

  @Override
  public void success(StatesObject params) {
    successObject(params);
  }

  @Override
  public void success(StatesArray params) {
    successArray(params);
  }

  @Override
  public void success() {
    successObject(new StatesObject.Builder().build());
  }

  public native void successObject(StatesObject response);

  public native void successArray(StatesArray response);

  @Override
  public native void error(StatesObject response);
}
