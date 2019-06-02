/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.plugins.react

import org.stato.core.StatoPluginConnection
import org.stato.core.StatoPlugin

class ReactStatoPlugin : StatoPlugin {

  private var connection: StatoPluginConnection? = null

  override val id: String
    get() = ID

  override fun onConnect(connection: StatoPluginConnection) {
    this.connection = connection
    connection.receive("config") { params, responder ->
      // set received host and port in react-native

    }
  }

  override fun onDisconnect() {
    connection = null
  }

  override fun runInBackground(): Boolean {
    return true
  }

  companion object {

    val ID = "React"
  }
}
