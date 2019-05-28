package com.facebook.stato.nativeplugins.table;

import com.facebook.stato.core.StatoConnection;
import com.facebook.stato.nativeplugins.NativePlugin;
import com.facebook.stato.nativeplugins.RawNativePlugin;

public abstract class TablePlugin implements NativePlugin {

  public abstract TableMetadata getMetadata();

  public void onConnect(TableRowDisplay display) {}

  public void onDisconnect() {};

  @Override
  public final RawNativePlugin asStatoPlugin() {
    return new RawNativePlugin("Table", getTitle()) {

      @Override
      public void onConnect(final StatoConnection connection) throws Exception {
        final TableRowDisplay display = new TableRowDisplayImpl(connection, TablePlugin.this);
        TablePlugin.this.onConnect(display);
      }

      @Override
      public void onDisconnect() throws Exception {
        TablePlugin.this.onDisconnect();
      }

      @Override
      public boolean runInBackground() {
        return false;
      }
    };
    }

}
