/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package org.stato.plugins.inspector

import java.lang.ref.SoftReference
import java.util.HashMap

class ObjectTracker internal constructor() {

  private val objects = mutableMapOf<String,SoftReference<Any>>()

  internal fun put(id: String, obj: Any) {
    objects[id] = SoftReference(obj)
  }


  operator fun get(id: String): Any? {
    val softRef = objects[id] ?: return null

    val obj = softRef.get()
    if (obj == null) {
      objects.remove(id)
    }

    return obj
  }

  internal fun clear() {
    objects.clear()
  }

  internal operator fun contains(id: String): Boolean {
    return objects.containsKey(id)
  }
}
