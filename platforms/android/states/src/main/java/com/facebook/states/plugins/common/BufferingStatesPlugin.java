/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.states.plugins.common;

import com.facebook.states.core.StatesConnection;
import com.facebook.states.core.StatesObject;
import com.facebook.states.core.StatesPlugin;
import javax.annotation.Nullable;

/**
 * States plugin that keeps events in a buffer until a connection is available.
 *
 * <p>In order to send data to the {@link StatesConnection}, use {@link #send(String,
 * StatesObject)} instead of {@link StatesConnection#send(String, StatesObject)}.
 */
public abstract class BufferingStatesPlugin implements StatesPlugin {

  private static final int BUFFER_SIZE = 500;

  private @Nullable RingBuffer<CachedStatesEvent> mEventQueue;
  private @Nullable StatesConnection mConnection;

  @Override
  public synchronized void onConnect(StatesConnection connection) {
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

  public synchronized StatesConnection getConnection() {
    return mConnection;
  }

  public synchronized boolean isConnected() {
    return mConnection != null;
  }

  public synchronized void send(String method, StatesObject statesObject) {
    if (mEventQueue == null) {
      mEventQueue = new RingBuffer<>(BUFFER_SIZE);
    }
    if (mConnection != null) {
      mConnection.send(method, statesObject);
    } else {
      mEventQueue.enqueue(new CachedStatesEvent(method, statesObject));
    }
  }

  private synchronized void sendBufferedEvents() {
    if (mEventQueue != null && mConnection != null) {
      for (CachedStatesEvent cachedStatesEvent : mEventQueue.asList()) {
        mConnection.send(cachedStatesEvent.method, cachedStatesEvent.statesObject);
      }
      mEventQueue.clear();
    }
  }

  private static class CachedStatesEvent {
    final String method;
    final StatesObject statesObject;

    private CachedStatesEvent(String method, StatesObject statesObject) {
      this.method = method;
      this.statesObject = statesObject;
    }
  }
}
