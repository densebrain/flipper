package com.facebook.stato.nativeplugins;

import com.facebook.stato.core.StatoClient;

public class NativePluginRegistry {

  private final StatoClient client;

  public NativePluginRegistry(StatoClient client) {
    this.client = client;
  }

  public void register(final NativePlugin plugin) {
    client.addPlugin(plugin.asStatoPlugin());
  }
}
