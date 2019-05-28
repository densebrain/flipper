package com.facebook.stato.nativeplugins.components;

import com.facebook.stato.core.StatoObject;

public class JsonSidebarSection implements SidebarSection {
  private final String title;
  private final StatoObject content;

  public JsonSidebarSection(String title, StatoObject content) {
    this.title = title;
    this.content = content;
  }

  @Override
  public StatoObject serialize() {
    return new StatoObject.Builder()
        .put("title", title)
        .put("type", "json")
        .put("content", content)
        .build();
  }
}
