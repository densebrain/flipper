package com.facebook.states.core;

public interface StatesStateUpdateListener {

  /**
   * Called when the state of the States client changes. Typical implementations will subscribe by
   * calling {@link com.facebook.states.core.StatesClient#subscribeForUpdates()}, to start
   * receiving update events. Calling {@link com.facebook.states.core.StatesClient#getState()}
   * will retrieve the updated state.
   */
  void onUpdate();
}
