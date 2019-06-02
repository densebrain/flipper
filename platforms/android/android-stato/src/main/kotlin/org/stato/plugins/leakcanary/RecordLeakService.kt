/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.plugins.leakcanary

import com.squareup.leakcanary.LeakCanary.leakInfo

import org.stato.android.AndroidStatoClientManager
import com.squareup.leakcanary.AbstractAnalysisResultService
import com.squareup.leakcanary.AnalysisResult
import com.squareup.leakcanary.HeapDump
import org.stato.core.getPlugin
/**
 * When a leak is detected, sends results to connected Stato desktop app. In order to use this
 * service in place of the default, a custom RefWatcher will need to be created See
 * https://github.com/square/leakcanary/wiki/Customizing-LeakCanary#uploading-to-a-server
 */
class RecordLeakService : AbstractAnalysisResultService() {
    override fun onHeapAnalyzed(heapDump: HeapDump, result: AnalysisResult) {
    val leakInfo = leakInfo(this, heapDump, result, true)

      AndroidStatoClientManager.client?.let { client ->
      client.getPlugin<LeakCanaryStatoPlugin>()?.run {
        reportLeak(leakInfo)
      }
    }
  }
}
