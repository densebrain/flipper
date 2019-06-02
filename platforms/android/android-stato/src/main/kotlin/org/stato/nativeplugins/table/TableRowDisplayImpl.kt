package org.stato.nativeplugins.table

import org.stato.core.StatoArray
import org.stato.core.StatoPluginConnection
import org.stato.core.StatoObject
import org.stato.core.StatoResponder

class TableRowDisplayImpl internal constructor(private val connection: StatoPluginConnection, subscriber: TablePlugin) : TableRowDisplay {

  init {
    connection.receive(
      "getMetadata") { params: StatoObject, responder: StatoResponder ->
          val columns = StatoObject.Builder()
          val columnSizes = StatoObject.Builder()
          val columnOrder = StatoArray.Builder()
          val filterableColumns = StatoArray.Builder()
          for (c in subscriber.metadata.columns) {
            columns.put(c.id, StatoObject.Builder().put("value", c.displayName).build())
            columnSizes.put(c.id, c.displayWidth)
            columnOrder.put(
              StatoObject.Builder().put("key", c.id).put("visible", c.showByDefault))
            if (c.isFilterable) {
              filterableColumns.put(c.id)
            }
          }

          responder.success(
            StatoObject.Builder()
              .put("columns", columns.build())
              .put("columnSizes", columnSizes.build())
              .put("columnOrder", columnOrder.build())
              .put("filterableColumns", filterableColumns.build())
              .build())
        }

  }

    override fun updateRow(row: TableRow, tableMetadata: TableMetadata) {
    val array = StatoArray.Builder()
    array.put(row.serialize())
    this.connection.send("updateRows", array.build())
  }

    override fun updateRows(rows: List<TableRow>, tableMetadata: TableMetadata) {
    val array = StatoArray.Builder()
    for (r in rows) {
      array.put(r.serialize())
    }
    this.connection.send("updateRows", array.build())
  }
}
