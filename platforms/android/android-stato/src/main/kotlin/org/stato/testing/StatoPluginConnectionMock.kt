/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.testing

import org.stato.core.*

class StatoPluginConnectionMock : StatoPluginConnection {
  val receivers: MutableMap<String, StatoReceiverCallback> = mutableMapOf()
  val sent: MutableMap<String, MutableList<Any>> = mutableMapOf()
  val errors = mutableListOf<Throwable>()

  override fun send(method: String, params: StatoObject) {
    val paramList = sent.getOrPut(method) {
      mutableListOf()
    }

    paramList.add(params)
  }

  override fun send(method: String, params: StatoArray) {
    val paramList = sent.getOrPut(method) {
      mutableListOf()
    }

    paramList.add(params)
  }

  override fun reportError(throwable: Throwable) {
    errors.add(throwable)
  }

  override fun receive(method: String, receiver: StatoReceiverCallback) {
    receivers[method] = receiver
  }
}
