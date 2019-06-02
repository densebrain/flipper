package org.stato.core

interface StatoStateUpdateListener {

  /**
   * Called when the state of the Stato client changes. Typical implementations will subscribe by
   * calling [org.stato.core.StatoClient.subscribeForUpdates], to start
   * receiving update events. Calling [org.stato.core.StatoClient.getState]
   * will retrieve the updated state.
   */
  fun onUpdate()
}
