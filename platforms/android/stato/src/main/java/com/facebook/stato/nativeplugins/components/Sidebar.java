package com.facebook.stato.nativeplugins.components;

import com.facebook.stato.core.StatoArray;

public class Sidebar {

  private final StatoArray.Builder sections = new StatoArray.Builder();

  public Sidebar addSection(SidebarSection section) {
    sections.put(section.serialize());
    return this;
  }

  public StatoArray serialize() {
    return sections.build();
  }
}
