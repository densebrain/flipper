package com.facebook.states.android.diagnostics;

public interface StatesDiagnosticSummaryTextFilter {
  /** Reformat the string display of the summary if necessary. */
  CharSequence applyDiagnosticSummaryTextFilter(CharSequence summary);
}
