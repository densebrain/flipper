/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.states.core;

/**
 * StatesResponder is used to asyncronously response to a messaged recieved from the States
 * desktop app. The States Responder will automatically wrap the response in an approriate object
 * depending on if it is an error or not.
 */
public interface StatesResponder {

  /** Deliver a successful response to the States desktop app. */
  void success(StatesObject response);

  /** Deliver a successful response to the States desktop app. */
  void success(StatesArray response);

  /** Deliver a successful response to the States desktop app. */
  void success();

  /** Inform the States desktop app of an error in handling the request. */
  void error(StatesObject response);
}
