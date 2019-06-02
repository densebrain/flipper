package org.stato.nativeplugins.components

import org.stato.core.StatoArray
import org.stato.core.StatoObject

class ToolbarSidebarSection : SidebarSection {

  private var items = StatoArray.Builder()

  fun addLink(label: String, destination: String): ToolbarSidebarSection {
    items.put(
      StatoObject.Builder()
        .put("type", "link")
        .put("label", label)
        .put("destination", destination))
    return this
  }

    override fun serialize(): StatoObject {
    return StatoObject.Builder().put("type", "toolbar").put("items", items.build()).build()
  }
}
