/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.core

import org.stato.BuildConfig
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.soloader.SoLoader
import org.stato.core.*

@DoNotStrip
internal class StatoPluginConnectionImpl private constructor(private val hybridData: HybridData) : StatoPluginConnection {


  override fun send(method: String, params: StatoObject) {
    sendObject(method, params)
  }

  override fun send(method: String, params: StatoArray) {
    sendArray(method, params)
  }

  external fun sendObject(method: String, params: StatoObject)

  external fun sendArray(method: String, params: StatoArray)

    external override fun reportError(throwable: Throwable)

  external fun receive(method: String, receiver: StatoReceiver)

  override fun receive(method: String, receiver: StatoReceiverCallback) {



    receive(method, object: StatoReceiver {
      override fun onReceive(params: StatoObject, responder: StatoResponder) {
        //info("Received method: ${method}")
        receiver(params, responder)
      }
    })
  }

  companion object {
    init {
      @Suppress("ConstantConditionIf")
      if (BuildConfig.IS_INTERNAL_BUILD) {
        SoLoader.loadLibrary("android-stato")
      }
    }
  }
}
