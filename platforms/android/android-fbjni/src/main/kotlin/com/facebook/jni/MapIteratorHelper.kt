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
 * To iterate over a Map from C++ requires four calls per entry: hasNext(), next(), getKey(),
 * getValue(). This helper reduces it to one call and two field gets per entry. It does not use a
 * generic argument, since in C++, the types will be erased, anyway. This is *not* a [ ].
 */
@DoNotStrip
class MapIteratorHelper(map: Map<*, *>) {

  @DoNotStrip
  private val mIterator: Iterator<Map.Entry<*, *>> = map.entries.iterator()

  @DoNotStrip
  private var mKey: Any? = null

  @DoNotStrip
  private var mValue: Any? = null

  /**
   * Moves the helper to the next entry in the map, if any. Returns true iff there is an entry to
   * read.
   */
  @DoNotStrip
  operator fun hasNext(): Boolean =
    if (mIterator.hasNext()) {
      val entry = mIterator.next()
      mKey = entry.key
      mValue = entry.value
      true
    } else {
      mKey = null
      mValue = null
      false
    }

}
