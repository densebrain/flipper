/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.connectivitytest

import android.app.Activity
import android.widget.Toast
import org.stato.core.StatoPluginConnection
import org.stato.core.StatoObject
import org.stato.core.StatoPlugin

import org.stato.core.StatoResponder
import org.stato.sample.ExampleActions

class ConnectionTestPlugin(private val mActivity: Activity?) : StatoPlugin {

  private var mConnection: StatoPluginConnection? = null

  override val id  = ID

  override fun onConnect(connection: StatoPluginConnection) {
    mConnection = connection
    connection.receive(
      "displayMessage") { params: StatoObject, responder: StatoResponder ->
          mActivity?.runOnUiThread {
            Toast.makeText(mActivity, params.getString("message"), Toast.LENGTH_SHORT)
              .show()
          }

          responder.success(StatoObject.Builder().put("greeting", "Hello").build())
        }


    mActivity!!.runOnUiThread {
      ExampleActions.sendGetRequest()
      ExampleActions.sendPostRequest()
      // We want Stato to properly disconnect at this point and actually shut down the app.
      mActivity.finish()
      android.os.Process.sendSignal(android.os.Process.myPid(), 15)
    }
  }

  override fun onDisconnect() {
    mConnection = null
  }

  override fun runInBackground(): Boolean {
    return true
  }

  companion object {

    // We are reusing the existing "Example" logic here. That's generally a pretty bad idea,
    // but in war and in testing everything is fair.
    private val ID = "Example"
  }
}
