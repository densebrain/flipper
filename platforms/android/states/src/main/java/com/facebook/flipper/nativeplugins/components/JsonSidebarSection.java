package com.facebook.states.nativeplugins.components;

import com.facebook.states.core.StatesObject;

public class JsonSidebarSection implements SidebarSection {
  private final String title;
  private final StatesObject content;

  public JsonSidebarSection(String title, StatesObject content) {
    this.title = title;
    this.content = content;
  }

  @Override
  public StatesObject serialize() {
    return new StatesObject.Builder()
        .put("title", title)
        .put("type", "json")
        .put("content", content)
        .build();
  }
}
