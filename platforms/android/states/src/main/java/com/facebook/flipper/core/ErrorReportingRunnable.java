/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.states.core;

public abstract class ErrorReportingRunnable implements Runnable {

  private final StatesConnection mConnection;

  public ErrorReportingRunnable(StatesConnection connection) {
    mConnection = connection;
  }

  @Override
  public final void run() {
    try {
      runOrThrow();
    } catch (Exception e) {
      if (mConnection != null) {
        mConnection.reportError(e);
      }
    } finally {
      doFinally();
    }
  }

  protected void doFinally() {}

  protected abstract void runOrThrow() throws Exception;
}
