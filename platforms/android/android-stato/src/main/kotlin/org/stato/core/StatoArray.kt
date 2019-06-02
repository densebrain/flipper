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

class StatoArray(json: JSONArray?) {

  internal val json = json ?: JSONArray()


  constructor(json: String) : this(JSONArray(json))

  fun getDynamic(index: Int): StatoDynamic {
    return StatoDynamic(json.opt(index))
  }

  fun getString(index: Int): String {
    return json.optString(index)
  }

  fun getInt(index: Int): Int {
    return json.optInt(index)
  }

  fun getLong(index: Int): Long {
    return json.optLong(index)
  }

  fun getFloat(index: Int): Float {
    return json.optDouble(index).toFloat()
  }

  fun getDouble(index: Int): Double {
    return json.optDouble(index)
  }

  fun getBoolean(index: Int): Boolean {
    return json.optBoolean(index)
  }

  fun getObject(index: Int): StatoObject {
    val o = json.opt(index)
    return StatoObject(o as JSONObject)
  }

  fun getArray(index: Int): StatoArray {
    val o = json.opt(index)
    return StatoArray(o as JSONArray)
  }

  fun length(): Int {
    return json.length()
  }

  fun toStringList(): List<String> {
    return 0.until(length()).map { getString(it)}
  }

  fun toJsonString(): String {
    return toString()
  }


  override fun toString(): String {
    return json.toString()
  }

  override fun equals(other: Any?): Boolean {
    return json.toString() == other?.toString()
  }


  override fun hashCode(): Int {
    return json.hashCode()
  }

  class Builder {
    private val json: JSONArray = JSONArray()

    fun put(s: String): Builder {
      json.put(s)
      return this
    }

    fun put(i: Int): Builder {
      json.put(i)
      return this
    }

    fun put(l: Long): Builder {
      json.put(l)
      return this
    }

    fun put(f: Float): Builder {
      json.put(if (Float.NaN == f) null else f)
      return this
    }

    fun put(d: Double): Builder {
      json.put(if (Double.NaN == d) null else d)
      return this
    }

    fun put(b: Boolean): Builder {
      json.put(b)
      return this
    }

    fun put(v: StatoValue): Builder {
      return put(v.toStatoObject())
    }

    fun put(a: StatoArray?): Builder {
      json.put(a?.json)
      return this
    }

    fun put(b: Builder): Builder {
      return put(b.build())
    }

    fun put(o: StatoObject?): Builder {
      json.put(o?.json)
      return this
    }

    fun put(b: StatoObject.Builder): Builder {
      return put(b.build())
    }

    fun build(): StatoArray {
      return StatoArray(json)
    }
  }
}
