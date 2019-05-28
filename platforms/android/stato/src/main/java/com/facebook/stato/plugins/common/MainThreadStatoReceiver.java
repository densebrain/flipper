/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.stato.plugins.common;

import android.os.Handler;
import android.os.Looper;
import com.facebook.stato.core.StatoObject;
import com.facebook.stato.core.StatoReceiver;
import com.facebook.stato.core.StatoResponder;
import java.io.PrintWriter;
import java.io.StringWriter;

public abstract class MainThreadStatoReceiver implements StatoReceiver {

  private final Handler mHandler = new Handler(Looper.getMainLooper());

  @Override
  public final void onReceive(final StatoObject params, final StatoResponder responder) {
    mHandler.post(
        new Runnable() {
          @Override
          public void run() {
            try {
              onReceiveOnMainThread(params, responder);
            } catch (Exception ex) {
              responder.error(
                  new StatoObject.Builder()
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

  public abstract void onReceiveOnMainThread(StatoObject params, StatoResponder responder)
      throws Exception;
}
