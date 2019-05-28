/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.stato.core;

import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class StatoArray {
  final JSONArray mJson;

  public StatoArray(JSONArray json) {
    mJson = (json != null ? json : new JSONArray());
  }

  public StatoArray(String json) {
    try {
      mJson = new JSONArray(json);
    } catch (JSONException e) {
      throw new RuntimeException(e);
    }
  }

  public StatoDynamic getDynamic(int index) {
    return new StatoDynamic(mJson.opt(index));
  }

  public String getString(int index) {
    return mJson.optString(index);
  }

  public int getInt(int index) {
    return mJson.optInt(index);
  }

  public long getLong(int index) {
    return mJson.optLong(index);
  }

  public float getFloat(int index) {
    return (float) mJson.optDouble(index);
  }

  public double getDouble(int index) {
    return mJson.optDouble(index);
  }

  public boolean getBoolean(int index) {
    return mJson.optBoolean(index);
  }

  public StatoObject getObject(int index) {
    final Object o = mJson.opt(index);
    return new StatoObject((JSONObject) o);
  }

  public StatoArray getArray(int index) {
    final Object o = mJson.opt(index);
    return new StatoArray((JSONArray) o);
  }

  public int length() {
    return mJson.length();
  }

  public List<String> toStringList() {
    final int length = length();
    final List<String> list = new ArrayList<>(length);
    for (int i = 0; i < length; i++) {
      list.add(getString(i));
    }
    return list;
  }

  public String toJsonString() {
    return toString();
  }

  @Override
  public String toString() {
    return mJson.toString();
  }

  @Override
  public boolean equals(Object o) {
    return mJson.toString().equals(o.toString());
  }

  @Override
  public int hashCode() {
    return mJson.hashCode();
  }

  public static class Builder {
    private final JSONArray mJson;

    public Builder() {
      mJson = new JSONArray();
    }

    public Builder put(String s) {
      mJson.put(s);
      return this;
    }

    public Builder put(Integer i) {
      mJson.put(i);
      return this;
    }

    public Builder put(Long l) {
      mJson.put(l);
      return this;
    }

    public Builder put(Float f) {
      mJson.put(Float.isNaN(f) ? null : f);
      return this;
    }

    public Builder put(Double d) {
      mJson.put(Double.isNaN(d) ? null : d);
      return this;
    }

    public Builder put(Boolean b) {
      mJson.put(b);
      return this;
    }

    public Builder put(StatoValue v) {
      return put(v.toStatoObject());
    }

    public Builder put(StatoArray a) {
      mJson.put(a == null ? null : a.mJson);
      return this;
    }

    public Builder put(StatoArray.Builder b) {
      return put(b.build());
    }

    public Builder put(StatoObject o) {
      mJson.put(o == null ? null : o.mJson);
      return this;
    }

    public Builder put(StatoObject.Builder b) {
      return put(b.build());
    }

    public StatoArray build() {
      return new StatoArray(mJson);
    }
  }
}
