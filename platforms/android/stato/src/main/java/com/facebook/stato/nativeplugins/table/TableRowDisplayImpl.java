package com.facebook.stato.nativeplugins.table;

import com.facebook.stato.core.StatoArray;
import com.facebook.stato.core.StatoConnection;
import com.facebook.stato.core.StatoObject;
import com.facebook.stato.core.StatoReceiver;
import com.facebook.stato.core.StatoResponder;
import java.util.List;

public class TableRowDisplayImpl implements TableRowDisplay {

  private final StatoConnection mConnection;

  TableRowDisplayImpl(StatoConnection connection, final TablePlugin subscriber) {
    this.mConnection = connection;
    connection.receive(
        "getMetadata",
        new StatoReceiver() {
          @Override
          public void onReceive(StatoObject params, StatoResponder responder) throws Exception {
            final StatoObject.Builder columns = new StatoObject.Builder();
            final StatoObject.Builder columnSizes = new StatoObject.Builder();
            final StatoArray.Builder columnOrder = new StatoArray.Builder();
            final StatoArray.Builder filterableColumns = new StatoArray.Builder();
            for (Column c : subscriber.getMetadata().mColumns) {
              columns.put(c.id, new StatoObject.Builder().put("value", c.displayName).build());
              columnSizes.put(c.id, c.displayWidth);
              columnOrder.put(
                  new StatoObject.Builder().put("key", c.id).put("visible", c.showByDefault));
              if (c.isFilterable) {
                filterableColumns.put(c.id);
              }
            }

            responder.success(
                new StatoObject.Builder()
                    .put("columns", columns.build())
                    .put("columnSizes", columnSizes.build())
                    .put("columnOrder", columnOrder.build())
                    .put("filterableColumns", filterableColumns.build())
                    .build());
          }
        });
  }

  @Override
  public final void updateRow(TableRow row, TableMetadata tableMetadata) {
    final StatoArray.Builder array = new StatoArray.Builder();
    array.put(row.serialize());
    this.mConnection.send("updateRows", array.build());
  }

  @Override
  public final void updateRows(List<? extends TableRow> rows, TableMetadata tableMetadata) {
    final StatoArray.Builder array = new StatoArray.Builder();
    for (TableRow r : rows) {
      array.put(r.serialize());
    }
    this.mConnection.send("updateRows", array.build());
  }
}
