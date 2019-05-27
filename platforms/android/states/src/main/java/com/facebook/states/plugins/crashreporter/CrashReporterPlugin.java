/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
package com.facebook.states.plugins.crashreporter;

import android.app.Activity;
import androidx.annotation.Nullable;
import com.facebook.states.core.StatesConnection;
import com.facebook.states.core.StatesObject;
import com.facebook.states.core.StatesPlugin;

public class CrashReporterPlugin implements StatesPlugin {
  public static final String ID = "@states/plugin-crash-reporter";

  @Nullable private Activity mActivity;

  @Nullable private StatesConnection mConnection;

  @Nullable private Thread.UncaughtExceptionHandler prevHandler;
  private static CrashReporterPlugin crashreporterPlugin = null;

  private CrashReporterPlugin() {}

  // static method to create instance of Singleton class
  public static CrashReporterPlugin getInstance() {
    if (crashreporterPlugin == null) crashreporterPlugin = new CrashReporterPlugin();

    return crashreporterPlugin;
  }
  /*
   * Activity to be used to display incoming messages
   */
  public void setActivity(Activity activity) {
    mActivity = activity;
  }

  @Override
  public void onConnect(StatesConnection connection) {
    mConnection = connection;
  }
  // This function is called from Litho's error boundary.
  public void sendExceptionMessage(Thread paramThread, Throwable paramThrowable) {
    if (mConnection != null) {
      StatesConnection connection = mConnection;
      StringBuilder strBuilder = new StringBuilder("");
      StackTraceElement[] elems = paramThrowable.getStackTrace();
      for (int i = 0; i < elems.length; ++i) {
        strBuilder.append(elems[i].toString());
        if (i < elems.length - 1) {
          strBuilder.append("\n\tat ");
        }
      }
      connection.send(
          "crash-report",
          new StatesObject.Builder()
              .put("callstack", strBuilder.toString())
              .put("name", paramThrowable.toString())
              .put("reason", paramThrowable.getMessage())
              .build());
    }
  }

  @Override
  public void onDisconnect() {
    mConnection = null;
  }

  @Override
  public boolean runInBackground() {
    return true;
  }

  @Override
  public String getId() {
    return ID;
  }
}