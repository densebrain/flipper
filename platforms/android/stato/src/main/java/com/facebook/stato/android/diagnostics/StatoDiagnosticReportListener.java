/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.stato.android.diagnostics;

import com.facebook.stato.core.StatoClient;

/**
 * Implement this interface on your activity hosting {@link StatoDiagnosticFragment} to enable the
 * "Report Bug" button and receive a callback for it.
 */
public interface StatoDiagnosticReportListener {

  /**
   * Called when a bug report is requested, including the stato diagnostic information.
   *
   * @param state See {@link StatoClient#getState()}
   * @param summary See {@link StatoClient#getStateSummary()}
   */
  void report(String state, String summary);
}
