package org.stato.nativeplugins.table

import org.stato.core.StatoObject
import org.stato.nativeplugins.components.Sidebar

abstract class TableRow(val id: String?, val values: Map<Column, Value>?, val sidebar: Sidebar?) {
  interface Value {
    fun serialize(): StatoObject
  }

  class StringValue(private val `val`: String) : Value {

        override fun serialize(): StatoObject {
      return StatoObject.Builder().put("type", "string").put("value", `val`).build()
    }
  }

  class IntValue(private val `val`: Int) : Value {

        override fun serialize(): StatoObject {
      return StatoObject.Builder().put("type", "int").put("value", `val`).build()
    }
  }

  class BooleanValue(private val `val`: Boolean) : Value {

        override fun serialize(): StatoObject {
      return StatoObject.Builder().put("type", "boolean").put("value", `val`).build()
    }
  }

  class TimeValue(private val millis: Long) : Value {

        override fun serialize(): StatoObject {
      return StatoObject.Builder().put("type", "time").put("value", millis).build()
    }
  }

  class DurationValue(private val millis: Long) : Value {

        override fun serialize(): StatoObject {
      return StatoObject.Builder().put("type", "duration").put("value", millis).build()
    }
  }

  internal fun serialize(): StatoObject {
    val columnsObject = (values?: emptyMap()).entries.fold(StatoObject.Builder()) { builder, (key, value) ->
      builder.put(key.id, value.serialize())
    }.put("id", id)


    return StatoObject.Builder()
      .put("columns", columnsObject.build())
      .put("sidebar", sidebar!!.serialize())
      .put("id", id)
      .build()
  }

    override fun equals(other: Any?): Boolean {
      return serialize() == (other as? TableRow)?.serialize()

  }
}
