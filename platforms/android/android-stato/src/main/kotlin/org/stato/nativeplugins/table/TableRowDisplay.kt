package org.stato.nativeplugins.table

interface TableRowDisplay {
  fun updateRow(row: TableRow, tableMetadata: TableMetadata)

  fun updateRows(rows: List<TableRow>, tableMetadata: TableMetadata)
}
