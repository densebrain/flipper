package com.facebook.stato.nativeplugins.components;

import com.facebook.stato.core.StatoArray;
import com.facebook.stato.core.StatoObject;

public class ToolbarSidebarSection implements SidebarSection {
  StatoArray.Builder items = new StatoArray.Builder();

  public ToolbarSidebarSection addLink(String label, String destination) {
    items.put(
        new StatoObject.Builder()
            .put("type", "link")
            .put("label", label)
            .put("destination", destination));
    return this;
  }

  @Override
  public StatoObject serialize() {
    return new StatoObject.Builder().put("type", "toolbar").put("items", items.build()).build();
  }
}
