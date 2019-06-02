/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.plugins.example

import android.app.Activity
import android.widget.Toast
import org.stato.core.StatoPluginConnection
import org.stato.core.StatoObject
import org.stato.core.StatoPlugin
import org.stato.core.StatoResponder

class ExampleStatoPlugin : StatoPlugin {


  private var activity: Activity? = null


  private var connection: StatoPluginConnection? = null

  private var mNotificationsSent = 0

  override val id = ID

  /*
   * Activity to be used to display incoming messages
   */
  fun setActivity(activity: Activity) {
    this.activity = activity
  }

  override fun onConnect(connection: StatoPluginConnection) {
    this.connection = connection
    connection.receive(
      "displayMessage") { params: StatoObject, responder: StatoResponder ->
      activity?.runOnUiThread {

        Toast.makeText(activity, params.getString("message"), Toast.LENGTH_SHORT)
          .show()
      }



      responder.success(StatoObject.Builder().put("greeting", "Hello").build())
    }
  }


  fun triggerNotification() {
    val connection = connection ?: return

    connection.send(
      "triggerNotification", StatoObject.Builder().put("id", mNotificationsSent).build())
    mNotificationsSent++

  }

  override fun onDisconnect() {
    connection = null
  }

  override fun runInBackground(): Boolean {
    return true
  }

  companion object {

    val ID = "@stato/plugin-example"
  }
}
