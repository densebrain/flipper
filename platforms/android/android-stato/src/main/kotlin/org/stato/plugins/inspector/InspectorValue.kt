/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package org.stato.plugins.inspector

import org.stato.core.StatoObject
import org.stato.core.StatoValue

class InspectorValue<T> private constructor(val type: Type<T>?, val value: T?, val mutable: Boolean) : StatoValue {

  /**
   * Descrive the type of data this value contains. This will influence how values are parsed and
   * displayed by the Stato desktop app. For example colors will be parse as integers and
   * displayed using hex values and be editable using a color picker.
   *
   *
   * Do not extends this list of types without adding support for the type in the desktop
   * Inspector.
   */
  class Type<T> private constructor(private val name: String) {

        override fun toString(): String {
      return name
    }

    companion object {

      val Auto = Type<Any>("auto")
      val Text = Type<String>("text")
      val Number = Type<Number>("number")
      val Boolean = Type<Boolean>("boolean")
      val Enum = Type<String>("enum")
      val Color = Type<Int>("color")
    }
  }

    override fun toStatoObject(): StatoObject {
    return StatoObject.Builder()
      .put("__type__", type)
      .put("__mutable__", mutable)
      .put("value", value)
      .build()
  }

  companion object {

    fun <T> mutable(type: Type<T>, value: T): InspectorValue<T> {
      return InspectorValue(type, value, true)
    }

    fun <T> immutable(type: Type<T>, value: T): InspectorValue<T> {
      return InspectorValue(type, value, false)
    }

    fun mutable(value: Any?): InspectorValue<*> {
      return InspectorValue(Type.Auto, value, true)
    }

    fun immutable(value: Any?): InspectorValue<*> {
      return InspectorValue(Type.Auto, value, false)
    }
  }
}
