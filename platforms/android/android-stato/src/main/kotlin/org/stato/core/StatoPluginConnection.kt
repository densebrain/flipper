/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.core

/**
 * A connection between a StatoPlugin and the desktop Stato application. Register request
 * handlers to respond to calls made by the desktop application or directly send messages to the
 * desktop application.
 */
interface StatoPluginConnection {

  /**
   * Call a remote method on the Stato desktop application, passing an optional JSON object as a
   * parameter.
   */
  fun send(method: String, params: StatoObject)

  /**
   * Call a remote method on the Stato desktop application, passing an optional JSON array as a
   * parameter.
   */
  fun send(method: String, params: StatoArray)

  /** Report client error  */
  fun reportError(throwable: Throwable)

  /**
   * Register a receiver for a remote method call issued by the Stato desktop application. The
   * StatoReceiver is passed a responder to respond back to the desktop application.
   */

  fun receive(method: String, receiver: StatoReceiverCallback)
}
