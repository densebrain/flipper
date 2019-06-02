/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.testing

import org.stato.core.StatoArray
import org.stato.core.StatoObject
import org.stato.core.StatoResponder
import java.util.LinkedList

class StatoResponderMock : StatoResponder {
  val successes = mutableListOf<Any>()
  val errors = mutableListOf<StatoObject>()

    override fun success(response: StatoObject) {
    successes.add(response)
  }

    override fun success(response: StatoArray) {
    successes.add(response)
  }

    override fun success() {
    successes.add(StatoObject.Builder().build())
  }

    override fun error(response: StatoObject) {
    errors.add(response)
  }
}
