/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.plugins.common

import java.util.LinkedList

internal class RingBuffer<T>(private val bufferSize: Int) {
  private val buffer = LinkedList<T>()

  fun enqueue(item: T) {
    if (buffer.size >= bufferSize) {
      buffer.removeAt(0)
    }
    buffer.add(item)
  }

  fun clear() {
    buffer.clear()
  }

  val all
    get() = buffer


  fun toList(): List<T> {
    return buffer.toList()
  }
}
