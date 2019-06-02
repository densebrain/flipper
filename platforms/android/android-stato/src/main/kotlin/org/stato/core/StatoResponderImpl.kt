/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.core

import org.stato.BuildConfig
import org.stato.core.StatoArray
import org.stato.core.StatoObject
import org.stato.core.StatoResponder
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.soloader.SoLoader

@DoNotStrip
internal class StatoResponderImpl private constructor(private val hybridData: HybridData) : StatoResponder {

  override fun success(params: StatoObject) {
    successObject(params)
  }

  override fun success(params: StatoArray) {
    successArray(params)
  }

  override fun success() {
    successObject(StatoObject.Builder().build())
  }

  external fun successObject(response: StatoObject)

  external fun successArray(response: StatoArray)

  external override fun error(response: StatoObject)

  companion object {
    init {
      if (BuildConfig.IS_INTERNAL_BUILD) {
        SoLoader.loadLibrary("android-stato")
      }
    }
  }
}
