package com.facebook.states.nativeplugins.table;

import com.facebook.states.core.StatesArray;
import com.facebook.states.core.StatesConnection;
import com.facebook.states.core.StatesObject;
import com.facebook.states.core.StatesReceiver;
import com.facebook.states.core.StatesResponder;
import java.util.List;

public class TableRowDisplayImpl implements TableRowDisplay {

  private final StatesConnection mConnection;

  TableRowDisplayImpl(StatesConnection connection, final TablePlugin subscriber) {
    this.mConnection = connection;
    connection.receive(
        "getMetadata",
        new StatesReceiver() {
          @Override
          public void onReceive(StatesObject params, StatesResponder responder) throws Exception {
            final StatesObject.Builder columns = new StatesObject.Builder();
            final StatesObject.Builder columnSizes = new StatesObject.Builder();
            final StatesArray.Builder columnOrder = new StatesArray.Builder();
            final StatesArray.Builder filterableColumns = new StatesArray.Builder();
            for (Column c : subscriber.getMetadata().mColumns) {
              columns.put(c.id, new StatesObject.Builder().put("value", c.displayName).build());
              columnSizes.put(c.id, c.displayWidth);
              columnOrder.put(
                  new StatesObject.Builder().put("key", c.id).put("visible", c.showByDefault));
              if (c.isFilterable) {
                filterableColumns.put(c.id);
              }
            }

            responder.success(
                new StatesObject.Builder()
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
    final StatesArray.Builder array = new StatesArray.Builder();
    array.put(row.serialize());
    this.mConnection.send("updateRows", array.build());
  }

  @Override
  public final void updateRows(List<? extends TableRow> rows, TableMetadata tableMetadata) {
    final StatesArray.Builder array = new StatesArray.Builder();
    for (TableRow r : rows) {
      array.put(r.serialize());
    }
    this.mConnection.send("updateRows", array.build());
  }
}
