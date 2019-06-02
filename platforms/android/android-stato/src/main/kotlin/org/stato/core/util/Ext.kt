package org.stato.core.util

import java.util.concurrent.atomic.AtomicReference

fun <T> AtomicReference<T>.getOrPut(creator: () -> T): T {
  var value = get()
  if (value == null) {
    synchronized(this) {
      value = get()
      if (value == null) {
        set(creator())
        value = get()
      }
    }
  }
  return value
}