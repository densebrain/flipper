/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.core

import android.util.Log

abstract class ErrorReportingRunnable<R>(private val connection: StatoPluginConnection) : Runnable {

  var result: R? = null

  var error: Throwable? = null

  override fun run() {
    try {
      result = runOrThrow()
    } catch (e: Throwable) {
      Log.e(javaClass.simpleName, "Error occurred", e)
      connection.reportError(e)
    } finally {
      doFinally()
    }
  }

  protected open fun doFinally() {}

  @Throws(Exception::class)
  protected abstract fun runOrThrow(): R
}


@Suppress("TestFunctionName")
fun <R> ErrorReportingRunnable(connection: StatoPluginConnection, fn:ErrorReportingRunnable<R>.() -> R): ErrorReportingRunnable<R> {
  return object: ErrorReportingRunnable<R>(connection) {
    override fun runOrThrow():R {
      return fn.invoke(this)
    }
  }
}

fun <R> StatoPluginConnection.runOrThrow(fn: ErrorReportingRunnable<R>.() -> R): ErrorReportingRunnable<R> =
  ErrorReportingRunnable(this, fn)