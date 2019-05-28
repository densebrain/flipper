package com.facebook.stato.core;

public interface StatoStateUpdateListener {

  /**
   * Called when the state of the Stato client changes. Typical implementations will subscribe by
   * calling {@link com.facebook.stato.core.StatoClient#subscribeForUpdates()}, to start
   * receiving update events. Calling {@link com.facebook.stato.core.StatoClient#getState()}
   * will retrieve the updated state.
   */
  void onUpdate();
}
