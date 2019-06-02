package org.stato.nativeplugins.table;

public class TableMetadataTestUtils {

  public static Column[] getColumns(TableMetadata tableMetadata) {
    return tableMetadata.columns;
  }

  public static QueryableTableRowProvider getQueryResponder(TableMetadata tableMetadata) {
    return tableMetadata.getResponder();
  }
}
