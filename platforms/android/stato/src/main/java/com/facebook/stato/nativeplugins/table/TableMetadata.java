package com.facebook.stato.nativeplugins.table;

import androidx.annotation.Nullable;

public class TableMetadata {

  final Column[] mColumns;
  final QueryableTableRowProvider mResponder;

  public QueryableTableRowProvider getResponder() {
    return mResponder;
  }

  private TableMetadata(
      @Nullable Column[] columns, @Nullable QueryableTableRowProvider queryResponder) {
    this.mColumns = columns == null ? new Column[] {} : columns;
    this.mResponder = queryResponder;
  }

  public static class Builder {
    private Column[] columns;
    private QueryableTableRowProvider queryResponder;

    public Builder columns(Column... columns) {
      this.columns = columns;
      return this;
    }

    public Builder queryResponder(QueryableTableRowProvider responder) {
      this.queryResponder = responder;
      return this;
    }

    public TableMetadata build() {
      return new TableMetadata(columns, queryResponder);
    }
  }
}
