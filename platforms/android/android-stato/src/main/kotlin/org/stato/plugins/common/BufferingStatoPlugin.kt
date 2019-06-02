/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.plugins.common

import org.stato.core.StatoPluginConnection
import org.stato.core.StatoObject
import org.stato.core.StatoPlugin

/**
 * Stato plugin that keeps events in a buffer until a connection is available.
 *
 *
 * In order to send data to the [StatoPluginConnection], use [.send] instead of [StatoPluginConnection.send].
 */
abstract class BufferingStatoPlugin : StatoPlugin {


  private var mEventQueue: RingBuffer<CachedStatoEvent>? = null

  @get:Synchronized
  var connection: StatoPluginConnection? = null
    private set

  val isConnected: Boolean
    @Synchronized get() = connection != null


  @Synchronized
  override fun onConnect(connection: StatoPluginConnection) {
    this.connection = connection

    sendBufferedEvents()
  }


  @Synchronized
  override fun onDisconnect() {
    connection = null
  }

    override fun runInBackground(): Boolean {
    return true
  }

  @Synchronized
  fun send(method: String, statoObject: StatoObject) {
    if (mEventQueue == null) {
      mEventQueue = RingBuffer(BUFFER_SIZE)
    }
    if (connection != null) {
      connection!!.send(method, statoObject)
    } else {
      mEventQueue!!.enqueue(CachedStatoEvent(method, statoObject))
    }
  }

  @Synchronized
  private fun sendBufferedEvents() {
    if (mEventQueue != null && connection != null) {
      for (cachedStatoEvent in mEventQueue!!.all) {
        connection!!.send(cachedStatoEvent.method, cachedStatoEvent.statoObject)
      }
      mEventQueue!!.clear()
    }
  }

  data class CachedStatoEvent (val method: String, val statoObject: StatoObject)

  companion object {

    private const val BUFFER_SIZE = 500
  }
}
