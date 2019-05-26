package com.facebook.states.nativeplugins.table;

import com.facebook.states.core.StatesObject;
import com.facebook.states.nativeplugins.components.Sidebar;
import java.util.Map;

public abstract class TableRow {
  public interface Value {
    StatesObject serialize();
  }

  public static class StringValue implements Value {
    private String val;

    public StringValue(String s) {
      this.val = s;
    }

    @Override
    public StatesObject serialize() {
      return new StatesObject.Builder().put("type", "string").put("value", val).build();
    }
  }

  public static class IntValue implements Value {
    private int val;

    public IntValue(int i) {
      this.val = i;
    }

    @Override
    public StatesObject serialize() {
      return new StatesObject.Builder().put("type", "int").put("value", val).build();
    }
  }

  public static class BooleanValue implements Value {
    private boolean val;

    public BooleanValue(boolean i) {
      this.val = i;
    }

    @Override
    public StatesObject serialize() {
      return new StatesObject.Builder().put("type", "boolean").put("value", val).build();
    }
  }

  public static class TimeValue implements Value {
    private long millis;

    public TimeValue(long millis) {
      this.millis = millis;
    }

    @Override
    public StatesObject serialize() {
      return new StatesObject.Builder().put("type", "time").put("value", millis).build();
    }
  }

  public static class DurationValue implements Value {
    private long millis;

    public DurationValue(long millis) {
      this.millis = millis;
    }

    @Override
    public StatesObject serialize() {
      return new StatesObject.Builder().put("type", "duration").put("value", millis).build();
    }
  }

  final String id;
  final Map<Column, ? extends Value> values;
  final Sidebar sidebar;

  public TableRow(String id, Map<Column, ? extends Value> values, Sidebar sidebar) {
    this.id = id;
    this.values = values;
    this.sidebar = sidebar;
  }

  final StatesObject serialize() {
    StatesObject.Builder columnsObject = new StatesObject.Builder();
    for (Map.Entry<Column, ? extends Value> e : values.entrySet()) {
      columnsObject.put(e.getKey().id, e.getValue().serialize());
    }
    columnsObject.put("id", id);
    return new StatesObject.Builder()
        .put("columns", columnsObject.build())
        .put("sidebar", sidebar.serialize())
        .put("id", id)
        .build();
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null) {
      return false;
    }
    if (getClass() != o.getClass()) {
      return false;
    }
    return serialize().equals(((TableRow) o).serialize());
  }
}
