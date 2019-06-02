package org.stato.nativeplugins.table

import org.stato.core.StatoPluginConnection
import org.stato.nativeplugins.NativePlugin
import org.stato.nativeplugins.RawNativePlugin

abstract class TablePlugin : NativePlugin {

  abstract val metadata: TableMetadata

  fun onConnect(display: TableRowDisplay) {}

  fun onDisconnect() {}

    override fun asStatoPlugin(): RawNativePlugin {
    return object : RawNativePlugin("Table", title) {


      @Throws(Exception::class)
      override fun onConnect(connection: StatoPluginConnection) {
        val display = TableRowDisplayImpl(connection, this@TablePlugin)
        this@TablePlugin.onConnect(display)
      }


      @Throws(Exception::class)
      override fun onDisconnect() {
        this@TablePlugin.onDisconnect()
      }

            override fun runInBackground(): Boolean {
        return false
      }
    }
  }

}
