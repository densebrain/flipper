package com.facebook.states.nativeplugins.components;

import com.facebook.states.core.StatesArray;
import com.facebook.states.core.StatesObject;

public class ToolbarSidebarSection implements SidebarSection {
  StatesArray.Builder items = new StatesArray.Builder();

  public ToolbarSidebarSection addLink(String label, String destination) {
    items.put(
        new StatesObject.Builder()
            .put("type", "link")
            .put("label", label)
            .put("destination", destination));
    return this;
  }

  @Override
  public StatesObject serialize() {
    return new StatesObject.Builder().put("type", "toolbar").put("items", items.build()).build();
  }
}
