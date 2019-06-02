/*
 *  Copyright (c) 2004-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.core

import java.util.concurrent.atomic.AtomicReference

internal open class StatoThread(name: String) : Thread(name) {

  private val mutex = Object()

  private var eventBaseRef = AtomicReference<StatoEventBase?>(null)

  // ignore
  fun acquireEventBase(): StatoEventBase {

    while (eventBaseRef.get() == null) {
      try {
        synchronized(mutex) {
          mutex.wait()
        }
      } catch (e: InterruptedException) {
        throw RuntimeException("Interrupted before receipt of event base")
      }

    }
    return eventBaseRef.get()!!
  }

  override fun run() {
    synchronized(this) {
      try {
        eventBaseRef.set(StatoEventBase())
      } finally {
        synchronized(mutex) {
          mutex.notifyAll()
        }
      }
    }

    eventBaseRef.get()!!.loopForever()
  }
}
