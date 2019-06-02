/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.android.diagnostics

import android.annotation.SuppressLint
import android.content.Context
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.fragment.app.Fragment
import org.stato.android.AndroidStatoClientManager
import org.stato.core.StateSummary.State.*
import org.stato.core.StatoClient
import org.stato.core.StatoStateUpdateListener

class StatoDiagnosticFragment : Fragment(), StatoStateUpdateListener {

  internal lateinit var summaryView: TextView
  internal lateinit var logView: TextView
  internal lateinit var scrollView: ScrollView
  private lateinit var reportButton: Button


  private var reportCallback: StatoDiagnosticReportListener? = null

  private var diagnosticSummaryTextFilter: StatoDiagnosticSummaryTextFilter? = null

  private val mOnBugReportClickListener = View.OnClickListener {
    AndroidStatoClientManager.client?.let { client ->

      reportCallback?.report(
        client.state,
        summary.toString()
      )

    }
  }
  internal val summary: CharSequence
    get() {
      val context = getContext()
      val client = AndroidStatoClientManager.client ?: return ""
      val summary = client.stateSummary
      val stateText = StringBuilder(16)
      summary.list.forEach {

        val status = when (it.state) {
          IN_PROGRESS -> "⏳"
          SUCCESS -> "✅"
          FAILED -> "❌"
          UNKNOWN -> "❓"
        }
        stateText.append(status).append(it.name).append('\n')
      }
      return stateText.toString()
    }

  @SuppressLint("SetTextI18n")

  override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {

    val root = LinearLayout(context)
    root.orientation = LinearLayout.VERTICAL

    if (reportCallback != null) {
      reportButton = Button(context)
      reportButton.text = "Report Bug"
      reportButton.setOnClickListener(mOnBugReportClickListener)
    }
    summaryView = TextView(context)
    logView = TextView(getContext())
    scrollView = ScrollView(getContext())
    scrollView.addView(logView)
    if (reportButton != null) {
      root.addView(reportButton)
    }
    root.addView(summaryView)
    root.addView(scrollView)
    return root
  }


  override fun onStart() {
    super.onStart()
    try {
      val context = context!!
      AndroidStatoClientManager.Builder(context)
        .withOnReady(object : AndroidStatoClientManager.OnReadyCallback {
          override fun call(client: StatoClient) {
            client.subscribeForUpdates(this@StatoDiagnosticFragment)
            summaryView.text = summary
            logView.text = client.state
          }
        })
        .start()
    } catch (ex: Exception) {
      Log.e(javaClass.name, "Unable to build client", ex)
    }

    //final StatoClient client = AndroidStatoClientManager.getInstance(getContext());


  }

  override fun onResume() {
    super.onResume()
    scrollView.fullScroll(View.FOCUS_DOWN)
  }

  override fun onUpdate() {
    val client = AndroidStatoClientManager.client ?: return
    val state = client.state
    val summary = if (diagnosticSummaryTextFilter == null)
      summary
    else
      diagnosticSummaryTextFilter!!.applyDiagnosticSummaryTextFilter(summary)



    activity?.runOnUiThread {
      summaryView.text = summary
      logView.text = state
      scrollView.fullScroll(View.FOCUS_DOWN)
    }

  }

  override fun onStop() {
    super.onStop()
    AndroidStatoClientManager.client?.unsubscribe()
  }

  override fun onAttach(context: Context) {
    super.onAttach(context)

    reportCallback = context as? StatoDiagnosticReportListener

    diagnosticSummaryTextFilter = context as? StatoDiagnosticSummaryTextFilter

  }

  companion object {

    fun newInstance(): StatoDiagnosticFragment {
      return StatoDiagnosticFragment()
    }
  }
}
