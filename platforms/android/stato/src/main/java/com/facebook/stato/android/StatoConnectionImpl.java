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
import com.facebook.stato.core.StatoConnection;
import com.facebook.stato.core.StatoObject;
import com.facebook.stato.core.StatoReceiver;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;

@DoNotStrip
class StatoConnectionImpl implements StatoConnection {
  static {
    if (BuildConfig.IS_INTERNAL_BUILD) {
      SoLoader.loadLibrary("stato");
    }
  }

  private final HybridData mHybridData;

  private StatoConnectionImpl(HybridData hd) {
    mHybridData = hd;
  }

  @Override
  public void send(String method, StatoObject params) {
    sendObject(method, params);
  }

  @Override
  public void send(String method, StatoArray params) {
    sendArray(method, params);
  }

  public native void sendObject(String method, StatoObject params);

  public native void sendArray(String method, StatoArray params);

  @Override
  public native void reportError(Throwable throwable);

  @Override
  public native void receive(String method, StatoReceiver receiver);
}
