package com.facebook.states.nativeplugins.table;

import com.facebook.states.core.StatesConnection;
import com.facebook.states.nativeplugins.NativePlugin;
import com.facebook.states.nativeplugins.RawNativePlugin;

public abstract class TablePlugin implements NativePlugin {

  public abstract TableMetadata getMetadata();

  public void onConnect(TableRowDisplay display) {}

  public void onDisconnect() {};

  @Override
  public final RawNativePlugin asStatesPlugin() {
    return new RawNativePlugin("Table", getTitle()) {

      @Override
      public void onConnect(final StatesConnection connection) throws Exception {
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
