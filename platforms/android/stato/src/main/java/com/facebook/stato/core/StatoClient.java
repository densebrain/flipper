/*
 *  Copyright (c) Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.stato.core;

public interface StatoClient {
  void addPlugin(StatoPlugin plugin);

  <T extends StatoPlugin> T getPlugin(String id);

  <T extends StatoPlugin> T getPluginByClass(Class<T> cls);

  void removePlugin(StatoPlugin plugin);

  void start();

  void stop();

  void subscribeForUpdates(StatoStateUpdateListener stateListener);

  void unsubscribe();

  String getState();

  StateSummary getStateSummary();
}
