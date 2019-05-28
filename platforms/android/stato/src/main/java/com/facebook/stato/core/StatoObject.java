/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.stato.core;

import java.util.Arrays;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class StatoObject {
  final JSONObject mJson;

  public StatoObject(JSONObject json) {
    mJson = (json != null ? json : new JSONObject());
  }

  public StatoObject(String json) {
    try {
      mJson = new JSONObject(json);
    } catch (JSONException e) {
      throw new RuntimeException(e);
    }
  }

  public StatoDynamic getDynamic(String name) {
    return new StatoDynamic(mJson.opt(name));
  }

  public String getString(String name) {
    if (mJson.isNull(name)) {
      return null;
    }
    return mJson.optString(name);
  }

  public int getInt(String name) {
    return mJson.optInt(name);
  }

  public long getLong(String name) {
    return mJson.optLong(name);
  }

  public float getFloat(String name) {
    return (float) mJson.optDouble(name);
  }

  public double getDouble(String name) {
    return mJson.optDouble(name);
  }

  public boolean getBoolean(String name) {
    return mJson.optBoolean(name);
  }

  public StatoObject getObject(String name) {
    final Object o = mJson.opt(name);
    return new StatoObject((JSONObject) o);
  }

  public StatoArray getArray(String name) {
    final Object o = mJson.opt(name);
    return new StatoArray((JSONArray) o);
  }

  public boolean contains(String name) {
    return mJson.has(name);
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
    private final JSONObject mJson;

    public Builder() {
      mJson = new JSONObject();
    }

    public Builder put(String name, Object obj) {
      if (obj == null) {
        return put(name, (String) null);
      } else if (obj instanceof Integer) {
        return put(name, (Integer) obj);
      } else if (obj instanceof Long) {
        return put(name, (Long) obj);
      } else if (obj instanceof Float) {
        return put(name, (Float) obj);
      } else if (obj instanceof Double) {
        return put(name, (Double) obj);
      } else if (obj instanceof String) {
        return put(name, (String) obj);
      } else if (obj instanceof Boolean) {
        return put(name, (Boolean) obj);
      } else if (obj instanceof Object[]) {
        return put(name, Arrays.deepToString((Object[]) obj));
      } else if (obj instanceof StatoObject) {
        return put(name, (StatoObject) obj);
      } else if (obj instanceof StatoObject.Builder) {
        return put(name, (StatoObject.Builder) obj);
      } else if (obj instanceof StatoArray) {
        return put(name, (StatoArray) obj);
      } else if (obj instanceof StatoArray.Builder) {
        return put(name, (StatoArray.Builder) obj);
      } else if (obj instanceof StatoValue) {
        return put(name, ((StatoValue) obj).toStatoObject());
      } else {
        return put(name, obj.toString());
      }
    }

    public Builder put(String name, String s) {
      try {
        mJson.put(name, s);
      } catch (JSONException e) {
        throw new RuntimeException(e);
      }
      return this;
    }

    public Builder put(String name, Integer i) {
      try {
        mJson.put(name, i);
      } catch (JSONException e) {
        throw new RuntimeException(e);
      }
      return this;
    }

    public Builder put(String name, Long l) {
      try {
        mJson.put(name, l);
      } catch (JSONException e) {
        throw new RuntimeException(e);
      }
      return this;
    }

    public Builder put(String name, Float f) {
      try {
        mJson.put(name, Float.isNaN(f) ? null : f);
      } catch (JSONException e) {
        throw new RuntimeException(e);
      }
      return this;
    }

    public Builder put(String name, Double d) {
      try {
        mJson.put(name, Double.isNaN(d) ? null : d);
      } catch (JSONException e) {
        throw new RuntimeException(e);
      }
      return this;
    }

    public Builder put(String name, Boolean b) {
      try {
        mJson.put(name, b);
      } catch (JSONException e) {
        throw new RuntimeException(e);
      }
      return this;
    }

    public Builder put(String name, StatoValue v) {
      return put(name, v.toStatoObject());
    }

    public Builder put(String name, StatoArray a) {
      try {
        mJson.put(name, a == null ? null : a.mJson);
      } catch (JSONException e) {
        throw new RuntimeException(e);
      }
      return this;
    }

    public Builder put(String name, StatoArray.Builder b) {
      return put(name, b.build());
    }

    public Builder put(String name, StatoObject o) {
      try {
        mJson.put(name, o == null ? null : o.mJson);
      } catch (JSONException e) {
        throw new RuntimeException(e);
      }
      return this;
    }

    public Builder put(String name, StatoObject.Builder b) {
      return put(name, b.build());
    }

    public StatoObject build() {
      return new StatoObject(mJson);
    }
  }
}
