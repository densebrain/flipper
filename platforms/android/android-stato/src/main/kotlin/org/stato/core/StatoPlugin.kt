/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.core

/**
 * A StatoPlugin is an object which exposes an API to the Desktop Stato application. When a
 * connection is established the plugin is given a StatoPluginConnection on which it can register
 * request handlers and send messages. When the StatoPluginConnection is invalid onDisconnect is called.
 * onConnect may be called again on the same plugin object if Stato re-connects, this will provide
 * a new StatoPluginConnection, do not attempt to re-use the previous connection.
 */
interface StatoPlugin {

  /**
   * @return The id of this plugin. This is the namespace which Stato desktop plugins will call
   * methods on to route them to your plugin. This should match the id specified in your React
   * plugin.
   */
  val id: String

  /**
   * Called when a connection has been established. The connection passed to this method is valid
   * until [StatoPlugin.onDisconnect] is called.
   */
  @Throws(Exception::class)
  fun onConnect(connection: StatoPluginConnection)

  /**
   * Called when the connection passed to [StatoPlugin.onConnect] is no
   * longer valid. Do not try to use the connection in or after this method has been called.
   */
  @Throws(Exception::class)
  fun onDisconnect()

  /**
   * Returns true if the plugin is meant to be run in background too, otherwise it returns false.
   */
  fun runInBackground(): Boolean
}


interface StatoPluginFactory<P : StatoPlugin> {
  val id: String

  fun create():P
}