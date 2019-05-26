package com.facebook.states.nativeplugins.components;

import com.facebook.states.core.StatesArray;

public class Sidebar {

  private final StatesArray.Builder sections = new StatesArray.Builder();

  public Sidebar addSection(SidebarSection section) {
    sections.put(section.serialize());
    return this;
  }

  public StatesArray serialize() {
    return sections.build();
  }
}
