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
import com.facebook.states.core.StatesConnection;
import com.facebook.states.core.StatesObject;
import com.facebook.states.core.StatesReceiver;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;

@DoNotStrip
class StatesConnectionImpl implements StatesConnection {
  static {
    if (BuildConfig.IS_INTERNAL_BUILD) {
      SoLoader.loadLibrary("states");
    }
  }

  private final HybridData mHybridData;

  private StatesConnectionImpl(HybridData hd) {
    mHybridData = hd;
  }

  @Override
  public void send(String method, StatesObject params) {
    sendObject(method, params);
  }

  @Override
  public void send(String method, StatesArray params) {
    sendArray(method, params);
  }

  public native void sendObject(String method, StatesObject params);

  public native void sendArray(String method, StatesArray params);

  @Override
  public native void reportError(Throwable throwable);

  @Override
  public native void receive(String method, StatesReceiver receiver);
}
