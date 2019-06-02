/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package org.stato.plugins.leakcanary

import android.util.Log
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import org.stato.core.*

class LeakCanaryStatoPlugin : StatoPlugin {



  class Factory : StatoPluginFactory<LeakCanaryStatoPlugin> {
    override val id = ID

    override fun create() =
      LeakCanaryStatoPlugin()
  }

  private var connection: StatoPluginConnection? = null

  private val leakList = mutableListOf<String>()

  override val id = ID

    override fun onConnect(connection: StatoPluginConnection) {
    this.connection = connection
    sendLeakList()

    this.connection!!.receive(CLEAR_EVENT) { params: StatoObject, responder: StatoResponder ->
          leakList.clear()
        }
      }


  @Throws(Exception::class)
  override fun onDisconnect() {
    connection = null
  }

    override fun runInBackground(): Boolean {
    return false
  }

  private fun sendLeakList() {
    connection?.run {

      try {

        send(REPORT_LEAK_EVENT, StatoObject(JSONObject().put(LEAKS_KEY, JSONArray(leakList))))
      } catch (e: JSONException) {
        Log.w(TAG, "Failure to serialize leak list: ", e)
      }
    }

  }

  fun reportLeak(leakInfo: String) {
    leakList.add(leakInfo)
    sendLeakList()

  }

  companion object {
    const val ID = "@stato/plugin-leak-canary"
    private val TAG = "LeakCanaryStatoPlugin"

    private val REPORT_LEAK_EVENT = "reportLeak"
    private val CLEAR_EVENT = "clear"
    private val LEAKS_KEY = "leaks"
  }
}
