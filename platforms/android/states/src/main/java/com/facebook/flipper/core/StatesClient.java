/*
 *  Copyright (c) Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.states.core;

public interface StatesClient {
  void addPlugin(StatesPlugin plugin);

  <T extends StatesPlugin> T getPlugin(String id);

  <T extends StatesPlugin> T getPluginByClass(Class<T> cls);

  void removePlugin(StatesPlugin plugin);

  void start();

  void stop();

  void subscribeForUpdates(StatesStateUpdateListener stateListener);

  void unsubscribe();

  String getState();

  StateSummary getStateSummary();
}
