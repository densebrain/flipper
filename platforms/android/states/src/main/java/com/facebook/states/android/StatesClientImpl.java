/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.states.android;

import com.facebook.states.BuildConfig;
import com.facebook.states.core.StatesClient;
import com.facebook.states.core.StatesPlugin;
import com.facebook.states.core.StatesStateUpdateListener;
import com.facebook.states.core.StateSummary;
import com.facebook.jni.HybridData;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.soloader.SoLoader;
import java.util.HashMap;
import java.util.Map;

@DoNotStrip
class StatesClientImpl implements StatesClient {
  static {
    if (BuildConfig.IS_INTERNAL_BUILD) {
      SoLoader.loadLibrary("states");
    }
  }

  private final HybridData mHybridData;
  private final Map<Class<?>, String> mClassIdentifierMap = new HashMap(8);

  private StatesClientImpl(HybridData hd) {
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

  public static native StatesClientImpl getInstance();

  @Override
  public void addPlugin(StatesPlugin plugin) {
    mClassIdentifierMap.put(plugin.getClass(), plugin.getId());
    addPluginNative(plugin);
  }

  public native void addPluginNative(StatesPlugin plugin);

  /**
   * @deprecated Prefer using {@link #getPluginByClass(Class)} over the stringly-typed interface.
   */
  @Override
  @Deprecated
  public native <T extends StatesPlugin> T getPlugin(String id);

  @Override
  public <T extends StatesPlugin> T getPluginByClass(Class<T> cls) {
    final String id = mClassIdentifierMap.get(cls);
    //noinspection deprecation
    return getPlugin(id);
  }

  public native void removePluginNative(StatesPlugin plugin);

  @Override
  public void removePlugin(StatesPlugin plugin) {
    mClassIdentifierMap.remove(plugin.getClass());
    removePluginNative(plugin);
  }

  @Override
  public native void start();

  @Override
  public native void stop();

  @Override
  public native void subscribeForUpdates(StatesStateUpdateListener stateListener);

  @Override
  public native void unsubscribe();

  @Override
  public native String getState();

  @Override
  public native StateSummary getStateSummary();
}
