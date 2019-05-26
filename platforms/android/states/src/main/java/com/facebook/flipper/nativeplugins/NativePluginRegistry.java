package com.facebook.states.nativeplugins;

import com.facebook.states.core.StatesClient;

public class NativePluginRegistry {

  private final StatesClient client;

  public NativePluginRegistry(StatesClient client) {
    this.client = client;
  }

  public void register(final NativePlugin plugin) {
    client.addPlugin(plugin.asStatesPlugin());
  }
}
