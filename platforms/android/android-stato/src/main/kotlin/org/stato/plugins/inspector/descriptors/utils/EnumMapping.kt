/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package org.stato.plugins.inspector.descriptors.utils

import androidx.collection.SimpleArrayMap
import org.stato.plugins.inspector.InspectorValue.Type

import org.stato.plugins.inspector.InspectorValue

open class EnumMapping(private val defaultKey: String) {
  private val mapping = SimpleArrayMap<String,Int>()

  fun put(s: String, i: Int) {
    mapping.put(s, i)
  }

  @JvmOverloads
  operator fun get(i: Int, mutable: Boolean = true): InspectorValue<String> {
    return (0.until(mapping.size()).find { mapping.valueAt(it)  == i }?.let { at ->
      mapping.keyAt(at)
    } ?: defaultKey)
      .let { key ->
        when {
          mutable -> InspectorValue.mutable(Type.Enum, key)
          else -> InspectorValue.immutable(Type.Enum, key)
        }
      }
  }

  operator fun get(s: String): Int {
    return mapping[s] ?: mapping[defaultKey]!!
  }
}
