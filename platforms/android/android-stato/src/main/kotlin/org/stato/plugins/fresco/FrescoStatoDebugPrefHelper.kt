// Copyright 2004-present Facebook. All Rights Reserved.

package org.stato.plugins.fresco

interface FrescoStatoDebugPrefHelper {

  var isDebugOverlayEnabled: Boolean

  interface Listener {
    fun onEnabledStatusChanged(enabled: Boolean)
  }

  fun setDebugOverlayEnabledListener(l: Listener)
}
