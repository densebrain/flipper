/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.stato.core;

/**
 * A StatoPlugin is an object which exposes an API to the Desktop Stato application. When a
 * connection is established the plugin is given a StatoConnection on which it can register
 * request handlers and send messages. When the StatoConnection is invalid onDisconnect is called.
 * onConnect may be called again on the same plugin object if Stato re-connects, this will provide
 * a new StatoConnection, do not attempt to re-use the previous connection.
 */
public interface StatoPlugin {

  /**
   * @return The id of this plugin. This is the namespace which Stato desktop plugins will call
   *     methods on to route them to your plugin. This should match the id specified in your React
   *     plugin.
   */
  String getId();

  /**
   * Called when a connection has been established. The connection passed to this method is valid
   * until {@link StatoPlugin#onDisconnect()} is called.
   */
  void onConnect(StatoConnection connection) throws Exception;

  /**
   * Called when the connection passed to {@link StatoPlugin#onConnect(StatoConnection)} is no
   * longer valid. Do not try to use the connection in or after this method has been called.
   */
  void onDisconnect() throws Exception;

  /**
   Returns true if the plugin is meant to be run in background too, otherwise it returns false.
   */
  boolean runInBackground();
}
