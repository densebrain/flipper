/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.stato.plugins.common;

import com.facebook.stato.core.StatoConnection;
import com.facebook.stato.core.StatoObject;
import com.facebook.stato.core.StatoPlugin;
import javax.annotation.Nullable;

/**
 * Stato plugin that keeps events in a buffer until a connection is available.
 *
 * <p>In order to send data to the {@link StatoConnection}, use {@link #send(String,
 * StatoObject)} instead of {@link StatoConnection#send(String, StatoObject)}.
 */
public abstract class BufferingStatoPlugin implements StatoPlugin {

  private static final int BUFFER_SIZE = 500;

  private @Nullable RingBuffer<CachedStatoEvent> mEventQueue;
  private @Nullable StatoConnection mConnection;

  @Override
  public synchronized void onConnect(StatoConnection connection) {
    mConnection = connection;

    sendBufferedEvents();
  }

  @Override
  public synchronized void onDisconnect() {
    mConnection = null;
  }

  @Override
  public boolean runInBackground() {
    return true;
  }

  public synchronized StatoConnection getConnection() {
    return mConnection;
  }

  public synchronized boolean isConnected() {
    return mConnection != null;
  }

  public synchronized void send(String method, StatoObject statoObject) {
    if (mEventQueue == null) {
      mEventQueue = new RingBuffer<>(BUFFER_SIZE);
    }
    if (mConnection != null) {
      mConnection.send(method, statoObject);
    } else {
      mEventQueue.enqueue(new CachedStatoEvent(method, statoObject));
    }
  }

  private synchronized void sendBufferedEvents() {
    if (mEventQueue != null && mConnection != null) {
      for (CachedStatoEvent cachedStatoEvent : mEventQueue.asList()) {
        mConnection.send(cachedStatoEvent.method, cachedStatoEvent.statoObject);
      }
      mEventQueue.clear();
    }
  }

  private static class CachedStatoEvent {
    final String method;
    final StatoObject statoObject;

    private CachedStatoEvent(String method, StatoObject statoObject) {
      this.method = method;
      this.statoObject = statoObject;
    }
  }
}
