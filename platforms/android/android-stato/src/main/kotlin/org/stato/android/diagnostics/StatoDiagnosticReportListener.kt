/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.android.diagnostics

import org.stato.core.StatoClient

/**
 * Implement this interface on your activity hosting [StatoDiagnosticFragment] to enable the
 * "Report Bug" button and receive a callback for it.
 */
interface StatoDiagnosticReportListener {

  /**
   * Called when a bug report is requested, including the stato diagnostic information.
   *
   * @param state See [StatoClient.getState]
   * @param summary See [StatoClient.getStateSummary]
   */
  fun report(state: String, summary: String)
}
