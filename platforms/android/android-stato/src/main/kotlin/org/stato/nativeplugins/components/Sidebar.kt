package org.stato.nativeplugins.components

import org.stato.core.StatoArray

class Sidebar {

  private val sections = StatoArray.Builder()

  fun addSection(section: SidebarSection): Sidebar {
    sections.put(section.serialize())
    return this
  }

  fun serialize(): StatoArray {
    return sections.build()
  }
}
