package org.stato.core

class StateSummary {

  val list = mutableListOf<StateElement>()

  enum class State {
    IN_PROGRESS,
    SUCCESS,
    FAILED,
    UNKNOWN
  }

  class StateElement(val name: String, val state: State)

  fun addEntry(name: String, state: String) {


    list.add(StateElement(name, try {
      State.valueOf(state)
    } catch (e: RuntimeException) {
      State.UNKNOWN
    }))
  }
}
