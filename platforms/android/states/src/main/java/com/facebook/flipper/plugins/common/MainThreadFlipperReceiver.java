/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.states.plugins.common;

import android.os.Handler;
import android.os.Looper;
import com.facebook.states.core.StatesObject;
import com.facebook.states.core.StatesReceiver;
import com.facebook.states.core.StatesResponder;
import java.io.PrintWriter;
import java.io.StringWriter;

public abstract class MainThreadStatesReceiver implements StatesReceiver {

  private final Handler mHandler = new Handler(Looper.getMainLooper());

  @Override
  public final void onReceive(final StatesObject params, final StatesResponder responder) {
    mHandler.post(
        new Runnable() {
          @Override
          public void run() {
            try {
              onReceiveOnMainThread(params, responder);
            } catch (Exception ex) {
              responder.error(
                  new StatesObject.Builder()
                      .put("name", ex.getClass().getCanonicalName())
                      .put("message", ex.getMessage())
                      .put("stacktrace", getStackTraceString(ex))
                      .build());
            }
          }
        });
  }

  private static String getStackTraceString(Throwable th) {
    StringWriter stringWriter = new StringWriter();
    th.printStackTrace(new PrintWriter(stringWriter));
    return stringWriter.toString();
  }

  public abstract void onReceiveOnMainThread(StatesObject params, StatesResponder responder)
      throws Exception;
}
