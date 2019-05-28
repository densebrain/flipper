/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.stato.android;

import com.facebook.stato.BuildConfig;
import com.facebook.stato.core.StatoClient;
import com.facebook.stato.core.StatoPlugin;
import com.facebook.stato.core.StatoStateUpdateListener;
import com.facebook.stato.core.StateSummary;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;
import java.util.HashMap;
import java.util.Map;

@DoNotStrip
class StatoClientImpl implements StatoClient {
  static {
    if (BuildConfig.IS_INTERNAL_BUILD) {
      SoLoader.loadLibrary("stato");
    }
  }

  private final HybridData mHybridData;
  private final Map<Class<?>, String> mClassIdentifierMap = new HashMap<>(8);

  private StatoClientImpl(HybridData hd) {
    mHybridData = hd;
  }

  public static native void init(
      EventBase callbackWorker,
      EventBase connectionWorker,
      int insecurePort,
      int securePort,
      String host,
      String os,
      String device,
      String deviceId,
      String app,
      String appId,
      String privateAppDirectory);

  public static native StatoClientImpl getInstance();

  @Override
  public void addPlugin(StatoPlugin plugin) {
    mClassIdentifierMap.put(plugin.getClass(), plugin.getId());
    addPluginNative(plugin);
  }

  public native void addPluginNative(StatoPlugin plugin);

  /**
   * @deprecated Prefer using {@link #getPluginByClass(Class)} over the stringly-typed interface.
   */
  @Override
  @Deprecated
  public native <T extends StatoPlugin> T getPlugin(String id);

  @Override
  public <T extends StatoPlugin> T getPluginByClass(Class<T> cls) {
    final String id = mClassIdentifierMap.get(cls);
    //noinspection deprecation
    return getPlugin(id);
  }

  public native void removePluginNative(StatoPlugin plugin);

  @Override
  public void removePlugin(StatoPlugin plugin) {
    mClassIdentifierMap.remove(plugin.getClass());
    removePluginNative(plugin);
  }

  @Override
  public native void start();

  @Override
  public native void stop();

  @Override
  public native void subscribeForUpdates(StatoStateUpdateListener stateListener);

  @Override
  public native void unsubscribe();

  @Override
  public native String getState();

  @Override
  public native StateSummary getStateSummary();
}
