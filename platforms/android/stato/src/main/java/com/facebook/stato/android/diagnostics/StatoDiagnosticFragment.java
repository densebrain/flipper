/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.stato.android.diagnostics;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.facebook.stato.android.AndroidStatoClient;
import com.facebook.stato.core.StatoClient;
import com.facebook.stato.core.StatoStateUpdateListener;
import com.facebook.stato.core.StateSummary;
import com.facebook.stato.core.StateSummary.StateElement;

public class StatoDiagnosticFragment extends Fragment implements StatoStateUpdateListener {

  TextView mSummaryView;
  TextView mLogView;
  ScrollView mScrollView;
  Button mReportButton;

  @Nullable StatoDiagnosticReportListener mReportCallback;
  @Nullable StatoDiagnosticSummaryTextFilter mDiagnosticSummaryTextFilter;

  private final View.OnClickListener mOnBugReportClickListener =
      new View.OnClickListener() {
        @Override
        public void onClick(View v) {
          StatoClient client = AndroidStatoClient.getClient();
          if (client != null) {
            mReportCallback.report(
              client.getState(),
              getSummary().toString()
            );
          }
        }
      };

  public static StatoDiagnosticFragment newInstance() {
    return new StatoDiagnosticFragment();
  }

  @SuppressLint("SetTextI18n")
  @Nullable
  @Override
  public View onCreateView(
      @NonNull LayoutInflater inflater,
      @Nullable ViewGroup container,
      @Nullable Bundle savedInstanceState) {

    final LinearLayout root = new LinearLayout(getContext());
    root.setOrientation(LinearLayout.VERTICAL);

    if (mReportCallback != null) {
      mReportButton = new Button(getContext());
      mReportButton.setText("Report Bug");
      mReportButton.setOnClickListener(mOnBugReportClickListener);
    }
    mSummaryView = new TextView(getContext());
    mLogView = new TextView(getContext());
    mScrollView = new ScrollView(getContext());
    mScrollView.addView(mLogView);
    if (mReportButton != null) {
      root.addView(mReportButton);
    }
    root.addView(mSummaryView);
    root.addView(mScrollView);
    return root;
  }



  @Override
  public void onStart() {
    super.onStart();
    try {
      new AndroidStatoClient.Builder(getContext())
        .withOnReady(new AndroidStatoClient.OnReadyCallback() {
          @Override
          public void call(StatoClient client) {
            client.subscribeForUpdates(StatoDiagnosticFragment.this);
            mSummaryView.setText(getSummary());
            mLogView.setText(client.getState());
          }
        })
        .start();
    } catch (Exception ex) {
      Log.e(getClass().getName(),"Unable to build client",ex);
    }
    //final StatoClient client = AndroidStatoClient.getInstance(getContext());



  }

  @Override
  public void onResume() {
    super.onResume();
    mScrollView.fullScroll(View.FOCUS_DOWN);
  }

  @Override
  public void onUpdate() {
    final StatoClient client = AndroidStatoClient.getClient();
    if (client == null) return;
    final String state = client.getState();
    final CharSequence summary =
        mDiagnosticSummaryTextFilter == null
            ? getSummary()
            : mDiagnosticSummaryTextFilter.applyDiagnosticSummaryTextFilter(getSummary());

    final Activity activity = getActivity();
    if (activity != null) {
      activity.runOnUiThread(
          new Runnable() {
            @Override
            public void run() {
              mSummaryView.setText(summary);
              mLogView.setText(state);
              mScrollView.fullScroll(View.FOCUS_DOWN);
            }
          });
    }
  }

  CharSequence getSummary() {
    final Context context = getContext();
    final StatoClient client = AndroidStatoClient.getClient();
    if (client == null) return "";
    final StateSummary summary = client.getStateSummary();
    final StringBuilder stateText = new StringBuilder(16);
    for (StateElement e : summary.mList) {
      final String status;
      switch (e.getState()) {
        case IN_PROGRESS:
          status = "⏳";
          break;
        case SUCCESS:
          status = "✅";
          break;
        case FAILED:
          status = "❌";
          break;
        case UNKNOWN:
        default:
          status = "❓";
      }
      stateText.append(status).append(e.getName()).append('\n');
    }
    return stateText.toString();
  }

  @Override
  public void onStop() {
    super.onStop();
    final StatoClient client = AndroidStatoClient.getClient();
    if (client == null) return;
    //final StatoClient client = AndroidStatoClient.getInstance(getContext());
    client.unsubscribe();
  }

  @Override
  public void onAttach(Context context) {
    super.onAttach(context);

    if (context instanceof StatoDiagnosticReportListener) {
      mReportCallback = (StatoDiagnosticReportListener) context;
    }
    if (context instanceof StatoDiagnosticSummaryTextFilter) {
      mDiagnosticSummaryTextFilter = (StatoDiagnosticSummaryTextFilter) context;
    }
  }
}
