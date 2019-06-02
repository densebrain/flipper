package org.stato.nativeplugins

import org.stato.core.StatoClient

class NativePluginRegistry(private val client: StatoClient) {

  fun register(plugin: NativePlugin) {
    client.addPlugin(plugin.asStatoPlugin())
  }
}
