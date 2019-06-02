/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package org.stato.sample

import android.app.Application
import com.facebook.soloader.SoLoader

class StatoSampleApplication : Application() {

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, false)
    flipperInit(this)
  }

}
