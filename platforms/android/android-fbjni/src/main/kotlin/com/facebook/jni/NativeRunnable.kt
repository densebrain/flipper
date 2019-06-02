/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.jni

import com.facebook.jni.annotations.DoNotStrip

/** A Runnable that has a native run implementation.  */
@DoNotStrip
class NativeRunnable private constructor(private val hybridData: HybridData) : Runnable {

  external override fun run()
}
