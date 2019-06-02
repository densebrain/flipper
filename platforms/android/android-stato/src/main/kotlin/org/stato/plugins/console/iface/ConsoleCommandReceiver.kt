/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.plugins.console.iface

import org.stato.core.StatoPluginConnection
import org.stato.core.StatoObject
import org.stato.core.StatoResponder
import org.stato.plugins.common.MainThreadStatoReceiver

/**
 * Convenience class for adding console execution to a Stato Plugin. Calling [ ][ConsoleCommandReceiver.listenForCommands] will add the necessary listeners for responding to command execution calls.
 */
object ConsoleCommandReceiver {

  private val nullContextProvider = object : ContextProvider {

    override fun getObjectForId(id: String): Any? {
      return null
    }
  }

  /**
   * Incoming command execution calls may reference a context ID that means something to your
   * plugin. Implement [ContextProvider] to provide a mapping from context ID to java object.
   * This will allow your Stato plugin to control the execution context of the command.
   */
  interface ContextProvider {

    fun getObjectForId(id: String): Any?
  }

  @JvmOverloads
  fun listenForCommands(
    connection: StatoPluginConnection,
    scriptingEnvironment: ScriptingEnvironment,
    contextProvider: ContextProvider = nullContextProvider) {

    val session = scriptingEnvironment.startSession()
    val executeCommandReceiver = object : MainThreadStatoReceiver() {

      @Throws(Exception::class)
      override fun onReceiveOnMainThread(params: StatoObject, responder: StatoResponder) {
        val command = params.getString("command") ?: error("command can not be null")

        val contextObject = run {
          contextProvider
            .getObjectForId(params.getString("context")
              ?: return@run null
            )
        }
        try {
          val o = session.evaluateCommand(command, contextObject)
          responder.success(StatoObject(o))
        } catch (e: Exception) {
          responder.error(StatoObject.Builder().put("message", e.message).build())
        }

      }
    }
    val isEnabledReceiver = { _: StatoObject, responder: StatoResponder ->
      responder.success(
        StatoObject.Builder()
          .put("isEnabled", scriptingEnvironment.isEnabled)
          .build())
    }

    with(connection) {
      receive("executeCommand", executeCommandReceiver)
      receive("isConsoleEnabled", isEnabledReceiver)
    }
  }
}
