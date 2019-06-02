/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.plugins.common

import android.os.Handler
import android.os.Looper
import org.stato.core.StatoObject
import org.stato.core.StatoReceiver
import org.stato.core.StatoReceiverCallback
import org.stato.core.StatoResponder
import java.io.PrintWriter
import java.io.StringWriter

abstract class MainThreadStatoReceiver : StatoReceiverCallback {

  private val mHandler = Handler(Looper.getMainLooper())

  @Throws(Exception::class)
  abstract fun onReceiveOnMainThread(params: StatoObject, responder: StatoResponder)

  //override fun onReceive(params: StatoObject, responder: StatoResponder) {
  override fun invoke(params: StatoObject, responder: StatoResponder) {
    mHandler.post {
      try {
        onReceiveOnMainThread(params, responder)
      } catch (ex: Exception) {
        responder.error(
          StatoObject.Builder()
            .put("name", ex.javaClass.canonicalName!!)
            .put("message", ex.message)
            .put("stacktrace", getStackTraceString(ex))
            .build())
      }

    }
  }


  private fun getStackTraceString(th: Throwable): String {
    return StringWriter().apply {
      th.printStackTrace(PrintWriter(this))
    }.toString()
  }


}
