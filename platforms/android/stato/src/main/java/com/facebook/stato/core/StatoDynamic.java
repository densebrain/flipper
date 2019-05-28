/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.stato.core;

import javax.annotation.Nullable;
import org.json.JSONArray;
import org.json.JSONObject;

public class StatoDynamic {
  private final Object mObject;

  public StatoDynamic(Object object) {
    mObject = object;
  }

  public @Nullable String asString() {
    if (mObject == null) {
      return null;
    }
    return mObject.toString();
  }

  public int asInt() {
    if (mObject == null) {
      return 0;
    }
    if (mObject instanceof Integer) {
      return (Integer) mObject;
    }
    if (mObject instanceof Long) {
      return ((Long) mObject).intValue();
    }
    if (mObject instanceof Float) {
      return ((Float) mObject).intValue();
    }
    if (mObject instanceof Double) {
      return ((Double) mObject).intValue();
    }
    return 0;
  }

  public long asLong() {
    if (mObject == null) {
      return 0;
    }
    if (mObject instanceof Integer) {
      return (Integer) mObject;
    }
    if (mObject instanceof Long) {
      return (Long) mObject;
    }
    if (mObject instanceof Float) {
      return ((Float) mObject).longValue();
    }
    if (mObject instanceof Double) {
      return ((Double) mObject).longValue();
    }
    return 0;
  }

  public float asFloat() {
    if (mObject == null) {
      return 0;
    }
    if (mObject instanceof Integer) {
      return (Integer) mObject;
    }
    if (mObject instanceof Long) {
      return (Long) mObject;
    }
    if (mObject instanceof Float) {
      return (Float) mObject;
    }
    if (mObject instanceof Double) {
      return ((Double) mObject).floatValue();
    }
    return 0;
  }

  public double asDouble() {
    if (mObject == null) {
      return 0;
    }
    if (mObject instanceof Integer) {
      return (Integer) mObject;
    }
    if (mObject instanceof Long) {
      return (Long) mObject;
    }
    if (mObject instanceof Float) {
      return (Float) mObject;
    }
    if (mObject instanceof Double) {
      return (Double) mObject;
    }
    return 0;
  }

  public boolean asBoolean() {
    if (mObject == null) {
      return false;
    }
    return (Boolean) mObject;
  }

  public StatoObject asObject() {
    if (mObject instanceof JSONObject) {
      return new StatoObject((JSONObject) mObject);
    }
    return (StatoObject) mObject;
  }

  public StatoArray asArray() {
    if (mObject instanceof JSONArray) {
      return new StatoArray((JSONArray) mObject);
    }
    return (StatoArray) mObject;
  }
}
