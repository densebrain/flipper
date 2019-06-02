/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.core

import java.util.Arrays
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

class StatoObject(json: JSONObject? = null) {
  internal val json: JSONObject = json ?: JSONObject()

  constructor(json: String) : this(JSONObject(json))

  fun getDynamic(name: String): StatoDynamic {
    return StatoDynamic(json.opt(name))
  }

  fun getString(name: String): String? {
    return if (json.isNull(name)) {
      null
    } else json.optString(name)
  }

  fun getInt(name: String): Int {
    return json.optInt(name)
  }

  fun getLong(name: String): Long {
    return json.optLong(name)
  }

  fun getFloat(name: String): Double {
    return json.optDouble(name)
  }

  fun getDouble(name: String): Double {
    return json.optDouble(name)
  }

  fun getBoolean(name: String): Boolean {
    return json.optBoolean(name)
  }

  fun getObject(name: String): StatoObject {
    val o = json.opt(name)
    return StatoObject(o as JSONObject)
  }

  fun getArray(name: String): StatoArray {
    val o = json.opt(name)
    return StatoArray(o as JSONArray)
  }

  operator fun contains(name: String): Boolean {
    return json.has(name)
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
    private val json: JSONObject = JSONObject()

    fun put(name: String): Builder {
      json.put(name, JSONObject.NULL)
      return this
    }

    fun put(name: String, obj: Any?): Builder {
      return when (obj) {
        null -> put(name)
        is Int -> put(name, obj )
        is Long -> put(name, obj )
        is Float -> put(name, obj )
        is Double -> put(name, obj)
        is String -> put(name, obj )
        is Boolean -> put(name, obj )
        is Array<*> -> put(name, Arrays.deepToString(obj))
        is StatoObject -> put(name, obj)
        is Builder -> put(name, obj)
        is StatoArray -> put(name, obj)
        is StatoArray.Builder -> put(name, obj)
        is StatoValue -> put(name, (obj).toStatoObject())
        else -> put(name, obj.toString())
      }
    }

    fun put(name: String, s: String?): Builder {
      try {
        json.put(name, s ?: JSONObject.NULL)
      } catch (e: JSONException) {
        throw RuntimeException(e)
      }

      return this
    }

    fun put(name: String, i: Int?): Builder {
      try {
        json.put(name, i ?: JSONObject.NULL)
      } catch (e: JSONException) {
        throw RuntimeException(e)
      }

      return this
    }

    fun put(name: String, l: Long?): Builder {
      try {
        json.put(name, l ?: JSONObject.NULL)
      } catch (e: JSONException) {
        throw RuntimeException(e)
      }

      return this
    }

    fun put(name: String, f: Float?): Builder {
      try {
        json.put(name, (if (Float.NaN == f) JSONObject.NULL else f) ?: JSONObject.NULL)
      } catch (e: JSONException) {
        json.put(name, JSONObject.NULL)
        //throw RuntimeException(e)
      }

      return this
    }

    fun put(name: String, d: Double?): Builder {
      try {
        json.put(name, (if (Double.NaN == d) null else d) ?: JSONObject.NULL)
      } catch (e: JSONException) {
        throw RuntimeException(e)
      }

      return this
    }

    fun put(name: String, b: Boolean?): Builder {
      try {
        json.put(name, b?: JSONObject.NULL)
      } catch (e: JSONException) {
        throw RuntimeException(e)
      }

      return this
    }

    fun put(name: String, v: StatoValue?): Builder {
      return put(name, v?.toStatoObject() ?: JSONObject.NULL)
    }

    fun put(name: String, a: StatoArray?): Builder {
      try {
        json.put(name, if (a == null) null else a!!.json)
      } catch (e: JSONException) {
        throw RuntimeException(e)
      }

      return this
    }

    fun put(name: String, b: StatoArray.Builder?): Builder {
      return put(name, b?.build() ?: JSONObject.NULL)
    }

    fun put(name: String, o: StatoObject?): Builder {
      try {
        json.put(name, o?.json ?: JSONObject.NULL)
      } catch (e: JSONException) {
        throw RuntimeException(e)
      }

      return this
    }

    fun put(name: String, b: Builder): Builder {
      return put(name, b.build())
    }

    fun build(): StatoObject {
      return StatoObject(json)
    }
  }
}
