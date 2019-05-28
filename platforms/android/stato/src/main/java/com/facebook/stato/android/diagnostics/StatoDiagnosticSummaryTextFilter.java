package com.facebook.stato.android.diagnostics;

public interface StatoDiagnosticSummaryTextFilter {
  /** Reformat the string display of the summary if necessary. */
  CharSequence applyDiagnosticSummaryTextFilter(CharSequence summary);
}
