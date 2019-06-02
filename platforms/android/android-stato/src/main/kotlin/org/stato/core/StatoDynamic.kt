/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.core

import org.json.JSONArray
import org.json.JSONObject

class StatoDynamic(private val value: Any?) {

  fun asString(): String {
    return value?.toString() ?: ""
  }

  fun asInt(): Int =
    when (value) {
      is Number -> value.toInt()
      else -> 0
    }


  fun asLong(): Long =
    when (value) {
      is Number -> value.toLong()
      else -> 0
    }

  fun asFloat(): Float =
    when (value) {
      is Number -> value.toFloat()
      else -> 0f
    }

  fun asDouble(): Double =
    when (value) {
      is Number -> value.toDouble()
      else -> 0.0
    }

  fun asBoolean(): Boolean {
    return if (value == null) {
      false
    } else (value as Boolean?)!!
  }

  fun asObject(): StatoObject? = when(value) {
    is JSONObject -> StatoObject(value as JSONObject?)
    else -> value as StatoObject?
    }


  fun asArray(): StatoArray? = when(value) {
    is JSONArray -> StatoArray(value as JSONArray?)
    else -> value as StatoArray?
  }
}
