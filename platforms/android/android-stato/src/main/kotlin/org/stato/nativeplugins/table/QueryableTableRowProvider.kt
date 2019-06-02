package org.stato.nativeplugins.table

interface QueryableTableRowProvider {

  fun getQueryResults(query: String): TableQueryResult

  class TableQueryResult(internal val metadata: TableMetadata?, internal val results: List<TableRow>?)
}
