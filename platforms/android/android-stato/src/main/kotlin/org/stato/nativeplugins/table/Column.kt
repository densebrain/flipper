@file:Suppress("MemberVisibilityCanBePrivate")

package org.stato.nativeplugins.table

class Column(
  val id: String,
  val displayName: String,
  val displayWidth: String?,
  val showByDefault: Boolean,
  val isFilterable: Boolean) {

  class Builder(private val id: String, private val displayName: String) {
    private var displayWidth: String? = null
    private var showByDefault = true
    private var isFilterable = false


    fun displayWidthPx(displayWidth: Int): Builder {
      this.displayWidth = Integer.toString(displayWidth)
      return this
    }

    fun displayWidthPercent(displayWidth: Int): Builder {
      this.displayWidth = Integer.toString(displayWidth) + "%"
      return this
    }

    fun showByDefault(showByDefault: Boolean): Builder {
      this.showByDefault = showByDefault
      return this
    }

    fun isFilterable(isFilterable: Boolean): Builder {
      this.isFilterable = isFilterable
      return this
    }

    fun build(): Column {
      return Column(id, displayName, displayWidth, showByDefault, isFilterable)
    }
  }
}
