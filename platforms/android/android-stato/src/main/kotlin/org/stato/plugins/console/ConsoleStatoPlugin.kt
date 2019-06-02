/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.plugins.console

import org.stato.core.StatoPluginConnection
import org.stato.core.StatoPlugin
import org.stato.plugins.console.iface.ConsoleCommandReceiver

class ConsoleStatoPlugin(private val javascriptEnvironment: JavascriptEnvironment) : StatoPlugin {

  override val id = "@stato/plugin-console"


  @Throws(Exception::class)
  override fun onConnect(connection: StatoPluginConnection) {
    ConsoleCommandReceiver.listenForCommands(connection, javascriptEnvironment)
  }

  @Throws(Exception::class)
  override fun onDisconnect() {
  }

  override fun runInBackground(): Boolean {
    return false
  }
}
