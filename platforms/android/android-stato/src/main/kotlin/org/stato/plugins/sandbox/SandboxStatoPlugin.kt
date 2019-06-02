/*
 *  Copyright (c) 2004-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.plugins.sandbox

import org.stato.core.StatoArray
import org.stato.core.StatoPluginConnection
import org.stato.core.StatoObject
import org.stato.core.StatoPlugin
import org.stato.core.StatoResponder

class SandboxStatoPlugin(private val strategy: SandboxStatoPluginStrategy) : StatoPlugin {

  override val id = "@stato/plugin-sandbox"


  override fun onConnect(connection: StatoPluginConnection) {
    connection.receive(
      GET_METHOD_NAME) { _: StatoObject, responder: StatoResponder ->
      val sandboxes = StatoArray.Builder()
      val knownSandboxes = strategy.knownSandboxes
//        ?: run {
//        responder.success(sandboxes.build())
//        return@receive
//      }

      knownSandboxes.entries.forEach { (name, sandbox) ->

        sandboxes.put(
          StatoObject.Builder()
            .put("name", name)
            .put("value", sandbox)
        )
      }
      responder.success(sandboxes.build())
    }


    connection.receive(
      SET_METHOD_NAME) { params: StatoObject, responder: StatoResponder ->
      params.getString("sandbox")?.let {
        strategy.setSandbox(it)
        responder.success(StatoObject.Builder().put("result", true).build())
      }
    }

  }

  override fun onDisconnect() {
  }

  override fun runInBackground(): Boolean {
    return false
  }

  companion object {

    private const val SET_METHOD_NAME = "setSandbox"
    private const val GET_METHOD_NAME = "getSandbox"
  }
}
