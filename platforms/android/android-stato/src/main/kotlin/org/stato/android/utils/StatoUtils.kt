/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.android.utils

import android.app.ActivityManager
import android.content.Context
import org.stato.BuildConfig

object StatoUtils {

  private val isEndToEndTest: Boolean
    get() {
      val value = System.getenv("BUDDY_SONAR_DISABLED")
      if (value == null || value.isBlank()) {
        return false
      }

      return value.toBoolean()

    }

  fun shouldEnableStato(context: Context): Boolean {
    return BuildConfig.IS_INTERNAL_BUILD && !isEndToEndTest && isMainProcess(context)
  }

  private fun isMainProcess(context: Context): Boolean {
    val pid = android.os.Process.myPid()
    val manager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    val infoList = manager.runningAppProcesses

    return context.packageName ==  infoList?.find { it.pid == pid }?.processName
  }
}
