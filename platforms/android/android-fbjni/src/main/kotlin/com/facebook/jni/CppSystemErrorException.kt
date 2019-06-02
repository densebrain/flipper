/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.jni

import com.facebook.jni.annotations.DoNotStrip

@DoNotStrip
class CppSystemErrorException @DoNotStrip
constructor(message: String, errorCode: Int) : CppException(message) {
  var errorCode: Int = 0
    internal set

  init {
    this.errorCode = errorCode
  }
}
