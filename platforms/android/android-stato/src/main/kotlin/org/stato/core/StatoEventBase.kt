/*
 *  Copyright (c) 2004-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.core

import org.stato.BuildConfig
import com.facebook.jni.HybridClassBase
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.soloader.SoLoader

@DoNotStrip
class StatoEventBase : HybridClassBase() {
  init {
    initHybrid()
  }

  @DoNotStrip
  external fun loopForever()

  @DoNotStrip
  private external fun initHybrid()

  companion object {
    init {
      @Suppress("ConstantConditionIf")
      if (BuildConfig.IS_INTERNAL_BUILD) {
        SoLoader.loadLibrary("android-stato")
      }
    }
  }
}
