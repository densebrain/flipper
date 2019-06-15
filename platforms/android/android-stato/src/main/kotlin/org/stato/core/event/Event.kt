package org.stato.core.event

import org.densebrain.android.logging.DroidLogger
import org.densebrain.android.logging.debug
import org.densebrain.android.logging.warn

open class Event<T>(private val once: Boolean) {

  companion object : DroidLogger

  private var handlers = listOf<(T) -> Unit>()

  private var mostRecentEvent: T? = null

  operator fun plusAssign(handler: (T) -> Unit) {
    on(handler)
  }

  infix fun on(handler: (T) -> Unit) {
    synchronized(this) {
      handlers = handlers + handler
    }

    // If a "once" event and the event has been omitted, then
    // emit the same event
    val event = mostRecentEvent
    if (once && event != null) {
      debug("Automatically emitting existing once event: ${event}")
      handler(event)
    }
  }

  infix fun off(handler: (T) -> Unit) {
    synchronized(this) {
      handlers = handlers.filter { it != handler }
    }
  }

  fun emit(event: T) {
    lateinit var handlers:List<(T) -> Unit>

    synchronized(this) {
      if (once && mostRecentEvent != null) {
        warn("Already emitted once event: ${mostRecentEvent}")
        return
      }

      mostRecentEvent = event
      handlers = this.handlers.toList()
    }

    for (handler in handlers) {
      handler(event)
    }
  }
}