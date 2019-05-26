/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.states.android.diagnostics;

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
import com.facebook.states.android.AndroidStatesClient;
import com.facebook.states.core.StatesClient;
import com.facebook.states.core.StatesStateUpdateListener;
import com.facebook.states.core.StateSummary;
import com.facebook.states.core.StateSummary.StateElement;

public class StatesDiagnosticFragment extends Fragment implements StatesStateUpdateListener {

  TextView mSummaryView;
  TextView mLogView;
  ScrollView mScrollView;
  Button mReportButton;

  @Nullable StatesDiagnosticReportListener mReportCallback;
  @Nullable StatesDiagnosticSummaryTextFilter mDiagnosticSummaryTextFilter;

  private final View.OnClickListener mOnBugReportClickListener =
      new View.OnClickListener() {
        @Override
        public void onClick(View v) {
          StatesClient client = AndroidStatesClient.getClient();
          if (client != null) {
            mReportCallback.report(
              client.getState(),
              getSummary().toString()
            );
          }
        }
      };

  public static StatesDiagnosticFragment newInstance() {
    return new StatesDiagnosticFragment();
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
      new AndroidStatesClient.Builder(getContext())
        .withOnReady(new AndroidStatesClient.OnReadyCallback() {
          @Override
          public void call(StatesClient client) {
            client.subscribeForUpdates(StatesDiagnosticFragment.this);
            mSummaryView.setText(getSummary());
            mLogView.setText(client.getState());
          }
        })
        .start();
    } catch (Exception ex) {
      Log.e(getClass().getName(),"Unable to build client",ex);
    }
    //final StatesClient client = AndroidStatesClient.getInstance(getContext());



  }

  @Override
  public void onResume() {
    super.onResume();
    mScrollView.fullScroll(View.FOCUS_DOWN);
  }

  @Override
  public void onUpdate() {
    final StatesClient client = AndroidStatesClient.getClient();
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
    final StatesClient client = AndroidStatesClient.getClient();
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
    final StatesClient client = AndroidStatesClient.getClient();
    if (client == null) return;
    //final StatesClient client = AndroidStatesClient.getInstance(getContext());
    client.unsubscribe();
  }

  @Override
  public void onAttach(Context context) {
    super.onAttach(context);

    if (context instanceof StatesDiagnosticReportListener) {
      mReportCallback = (StatesDiagnosticReportListener) context;
    }
    if (context instanceof StatesDiagnosticSummaryTextFilter) {
      mDiagnosticSummaryTextFilter = (StatesDiagnosticSummaryTextFilter) context;
    }
  }
}
