/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
package org.stato.plugins.crashreporter

import android.app.Activity
import org.stato.core.StatoPluginConnection
import org.stato.core.StatoObject
import org.stato.core.StatoPlugin
import java.util.concurrent.atomic.AtomicReference

class CrashReporterPlugin private constructor() : StatoPlugin {


  private var activity: Activity? = null


  private var connection: StatoPluginConnection? = null


  private val prevHandler: Thread.UncaughtExceptionHandler? = null

  override val id = ID

  /*
   * Activity to be used to display incoming messages
   */
  fun setActivity(activity: Activity) {
    this.activity = activity
  }

  override fun onConnect(connection: StatoPluginConnection) {
    this.connection = connection
  }

  // This function is called from Litho's error boundary.
  fun sendExceptionMessage(paramThread: Thread, paramThrowable: Throwable) {
    if (connection != null) {
      val connection = connection
      val strBuilder = StringBuilder("")
      val elems = paramThrowable.getStackTrace()
      for (i in elems.indices) {
        strBuilder.append(elems[i].toString())
        if (i < elems.size - 1) {
          strBuilder.append("\n\tat ")
        }
      }
      connection!!.send(
        "crash-report",
        StatoObject.Builder()
          .put("callstack", strBuilder.toString())
          .put("name", paramThrowable.toString())
          .put("reason", paramThrowable.message)
          .build())
    }
  }

  override fun onDisconnect() {
    connection = null
  }

  override fun runInBackground(): Boolean {
    return true
  }

  companion object {
    val ID = "@stato/plugin-crash-reporter"

    private var crashReporterPluginRef = AtomicReference<CrashReporterPlugin?>(null)

    // static method to create instance of Singleton class
    val instance: CrashReporterPlugin
      @Synchronized
      get() = crashReporterPluginRef.get() ?: run {
        val plugin = CrashReporterPlugin()
        crashReporterPluginRef.set(plugin)
        return plugin
      }

  }
}
