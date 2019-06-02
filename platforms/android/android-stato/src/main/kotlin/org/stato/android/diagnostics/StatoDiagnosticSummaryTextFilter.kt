package org.stato.android.diagnostics

interface StatoDiagnosticSummaryTextFilter {
  /** Reformat the string display of the summary if necessary.  */
  fun applyDiagnosticSummaryTextFilter(summary: CharSequence): CharSequence
}
