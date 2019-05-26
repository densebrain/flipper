/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.states.android.diagnostics;

import com.facebook.states.core.StatesClient;

/**
 * Implement this interface on your activity hosting {@link StatesDiagnosticFragment} to enable the
 * "Report Bug" button and receive a callback for it.
 */
public interface StatesDiagnosticReportListener {

  /**
   * Called when a bug report is requested, including the states diagnostic information.
   *
   * @param state See {@link StatesClient#getState()}
   * @param summary See {@link StatesClient#getStateSummary()}
   */
  void report(String state, String summary);
}
