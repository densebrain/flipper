/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.stato.core;

/**
 * StatoResponder is used to asyncronously response to a messaged recieved from the Stato
 * desktop app. The Stato Responder will automatically wrap the response in an approriate object
 * depending on if it is an error or not.
 */
public interface StatoResponder {

  /** Deliver a successful response to the Stato desktop app. */
  void success(StatoObject response);

  /** Deliver a successful response to the Stato desktop app. */
  void success(StatoArray response);

  /** Deliver a successful response to the Stato desktop app. */
  void success();

  /** Inform the Stato desktop app of an error in handling the request. */
  void error(StatoObject response);
}
