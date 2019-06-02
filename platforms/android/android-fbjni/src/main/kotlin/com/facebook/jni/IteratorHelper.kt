/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.jni

import com.facebook.jni.annotations.DoNotStrip

/**
 * To iterate over an Iterator from C++ requires two calls per entry: hasNext() and next(). This
 * helper reduces it to one call and one field get per entry. It does not use a generic argument,
 * since in C++, the types will be erased, anyway. This is *not* a [java.util.Iterator].
 */
@DoNotStrip
class IteratorHelper {
  private val mIterator: Iterator<*>

  // This is private, but accessed via JNI.
  @DoNotStrip
  private var mElement: Any? = null

  @DoNotStrip
  constructor(iterator: Iterator<*>) {
    mIterator = iterator
  }

  @DoNotStrip
  constructor(iterable: Iterable<*>) {
    mIterator = iterable.iterator()
  }

  /**
   * Moves the helper to the next entry in the map, if any. Returns true iff there is an entry to
   * read.
   */
  @DoNotStrip
  internal operator fun hasNext(): Boolean {
    if (mIterator.hasNext()) {
      mElement = mIterator.next()
      return true
    } else {
      mElement = null
      return false
    }
  }
}
