/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.stato.plugins.leakcanary;

import static com.squareup.leakcanary.LeakCanary.leakInfo;

import com.facebook.stato.android.AndroidStatoClient;
import com.facebook.stato.core.StatoClient;
import com.squareup.leakcanary.AbstractAnalysisResultService;
import com.squareup.leakcanary.AnalysisResult;
import com.squareup.leakcanary.HeapDump;

/**
 * When a leak is detected, sends results to connected Stato desktop app. In order to use this
 * service in place of the default, a custom RefWatcher will need to be created See
 * https://github.com/square/leakcanary/wiki/Customizing-LeakCanary#uploading-to-a-server
 */
public class RecordLeakService extends AbstractAnalysisResultService {
  @Override
  protected void onHeapAnalyzed(HeapDump heapDump, AnalysisResult result) {
    final String leakInfo = leakInfo(this, heapDump, result, true);
    final StatoClient client = AndroidStatoClient.getClient();

    if (client != null) {
      final LeakCanaryStatoPlugin plugin = client.getPlugin("LeakCanary");
      if (plugin != null) {
        plugin.reportLeak(leakInfo);
      }
    }
  }
}
