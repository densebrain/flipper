package org.stato.nativeplugins.table

class TableMetadata(
  columns: List<Column>,
  val responder: QueryableTableRowProvider?
) {

  val columns = columns.toList()

  class Builder {
    private var columns: List<Column> = emptyList()
    private var queryResponder: QueryableTableRowProvider? = null

    fun columns(vararg columns: Column): Builder {
      this.columns = this.columns + listOf(*columns)
      return this
    }

    fun queryResponder(responder: QueryableTableRowProvider): Builder {
      this.queryResponder = responder
      return this
    }

    fun build(): TableMetadata {
      return TableMetadata(columns, queryResponder)
    }
  }
}
