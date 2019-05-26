package com.facebook.states.nativeplugins.table;

import static org.junit.Assert.assertEquals;

import com.facebook.states.core.StatesArray;
import com.facebook.states.core.StatesObject;
import com.facebook.states.nativeplugins.components.Sidebar;
import com.facebook.states.testing.StatesConnectionMock;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;

@RunWith(RobolectricTestRunner.class)
public class TableRowDisplayImplTest {

  StatesConnectionMock mConnection;
  MockTablePlugin mockTablePlugin;

  static final Column NAME_COLUMN =
      new Column.Builder("name")
          .displayName("Name")
          .displayWidthPercent(90)
          .isFilterable(true)
          .showByDefault(false)
          .build();
  static final Column AGE_COLUMN =
      new Column.Builder("age")
          .displayName("Age")
          .displayWidthPercent(50)
          .isFilterable(false)
          .showByDefault(true)
          .build();

  @Before
  public void setup() {
    mConnection = new StatesConnectionMock();
    mockTablePlugin = new MockTablePlugin();
  }

  private TableRow row(String id, String name, int age) {
    Map<Column, TableRow.Value> map1 = new HashMap<>();
    map1.put(NAME_COLUMN, new TableRow.StringValue(name));
    map1.put(AGE_COLUMN, new TableRow.IntValue(age));
    return new MockTableRow(id, map1, new Sidebar());
  }

  @Test
  public void testUpdateRow() {
    TableRowDisplay display = new TableRowDisplayImpl(mConnection, mockTablePlugin);
    display.updateRow(row("row1", "santa", 55), null);

    assertEquals(1, mConnection.sent.get("updateRows").size());
    StatesArray rowArray = (StatesArray) mConnection.sent.get("updateRows").get(0);
    assertEquals(1, rowArray.length());
    StatesObject updatedRow = rowArray.getObject(0);
    assertEquals(serializedRow("row1", "santa", 55), updatedRow);
  }

  @Test
  public void testUpdateRows() {
    TableRowDisplay display = new TableRowDisplayImpl(mConnection, mockTablePlugin);
    List<TableRow> rows = new ArrayList<>();
    rows.add(row("row1", "santa", 55));
    rows.add(row("row2", "elf", 15));
    display.updateRows(rows, null);

    assertEquals(1, mConnection.sent.get("updateRows").size());
    StatesArray rowArray = (StatesArray) mConnection.sent.get("updateRows").get(0);
    assertEquals(2, rowArray.length());
    assertEquals(serializedRow("row1", "santa", 55), rowArray.getObject(0));
    assertEquals(serializedRow("row2", "elf", 15), rowArray.getObject(1));
  }

  private StatesObject serializedRow(String id, String name, int age) {
    return new StatesObject(
        "{\"columns\":{\"name\":{\"type\":\"string\",\"value\":\""
            + name
            + "\"},\"id\":\""
            + id
            + "\",\"age\":{\"type\":\"int\",\"value\":"
            + age
            + "}},\"sidebar\":[],\"id\":\""
            + id
            + "\"}");
  }
}
