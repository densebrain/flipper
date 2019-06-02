package org.stato.nativeplugins.components

import org.stato.core.StatoObject

class JsonSidebarSection(private val title: String, private val content: StatoObject) : SidebarSection {

    override fun serialize(): StatoObject {
    return StatoObject.Builder()
      .put("title", title)
      .put("type", "json")
      .put("content", content)
      .build()
  }
}
