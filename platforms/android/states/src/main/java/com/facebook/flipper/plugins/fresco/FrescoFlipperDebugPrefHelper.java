// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.states.plugins.fresco;

public interface FrescoStatesDebugPrefHelper {

  interface Listener {
    void onEnabledStatusChanged(boolean enabled);
  }

  void setDebugOverlayEnabled(boolean enabled);

  boolean isDebugOverlayEnabled();

  void setDebugOverlayEnabledListener(Listener l);
}
