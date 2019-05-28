/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.stato.core;

/**
 * A connection between a StatoPlugin and the desktop Stato application. Register request
 * handlers to respond to calls made by the desktop application or directly send messages to the
 * desktop application.
 */
public interface StatoConnection {

  /**
   * Call a remote method on the Stato desktop application, passing an optional JSON object as a
   * parameter.
   */
  void send(String method, StatoObject params);

  /**
   * Call a remote method on the Stato desktop application, passing an optional JSON array as a
   * parameter.
   */
  void send(String method, StatoArray params);

  /** Report client error */
  void reportError(Throwable throwable);

  /**
   * Register a receiver for a remote method call issued by the Stato desktop application. The
   * StatoReceiver is passed a responder to respond back to the desktop application.
   */
  void receive(String method, StatoReceiver receiver);
}
