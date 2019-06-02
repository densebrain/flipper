/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.core

/**
 * StatoResponder is used to asyncronously response to a messaged recieved from the Stato
 * desktop app. The Stato Responder will automatically wrap the response in an approriate object
 * depending on if it is an error or not.
 */
interface StatoResponder {

  /** Deliver a successful response to the Stato desktop app.  */
  fun success(response: StatoObject)

  /** Deliver a successful response to the Stato desktop app.  */
  fun success(response: StatoArray)

  /** Deliver a successful response to the Stato desktop app.  */
  fun success()

  /** Inform the Stato desktop app of an error in handling the request.  */
  fun error(response: StatoObject)
}
