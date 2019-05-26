/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.states.core;

/**
 * A StatesPlugin is an object which exposes an API to the Desktop States application. When a
 * connection is established the plugin is given a StatesConnection on which it can register
 * request handlers and send messages. When the StatesConnection is invalid onDisconnect is called.
 * onConnect may be called again on the same plugin object if States re-connects, this will provide
 * a new StatesConnection, do not attempt to re-use the previous connection.
 */
public interface StatesPlugin {

  /**
   * @return The id of this plugin. This is the namespace which States desktop plugins will call
   *     methods on to route them to your plugin. This should match the id specified in your React
   *     plugin.
   */
  String getId();

  /**
   * Called when a connection has been established. The connection passed to this method is valid
   * until {@link StatesPlugin#onDisconnect()} is called.
   */
  void onConnect(StatesConnection connection) throws Exception;

  /**
   * Called when the connection passed to {@link StatesPlugin#onConnect(StatesConnection)} is no
   * longer valid. Do not try to use the connection in or after this method has been called.
   */
  void onDisconnect() throws Exception;

  /**
   Returns true if the plugin is meant to be run in background too, otherwise it returns false.
   */
  boolean runInBackground();
}
