/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.stato.core;

/**
 * A receiver of a remote method call issued by the Stato desktop application. If the given
 * responder is present it means the Stato desktop application is expecting a response.
 */
public interface StatoReceiver {

  /**
   * Reciver for a request sent from the Stato desktop client.
   *
   * @param params Optional set of parameters sent with the request.
   * @param responder Optional responder for request. Some requests don't warrant a response
   *     through. In this case the request should be made from the desktop using send() instead of
   *     call().
   */
  void onReceive(StatoObject params, StatoResponder responder) throws Exception;
}
