/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package com.facebook.stato.plugins.sharedpreferences;

import static android.content.Context.MODE_PRIVATE;

import android.content.Context;
import android.content.SharedPreferences;
import com.facebook.stato.core.StatoConnection;
import com.facebook.stato.core.StatoObject;
import com.facebook.stato.core.StatoPlugin;
import com.facebook.stato.core.StatoReceiver;
import com.facebook.stato.core.StatoResponder;
import java.io.File;
import java.io.FilenameFilter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class SharedPreferencesStatoPlugin implements StatoPlugin {

  private static final String SHARED_PREFS_DIR = "@stato/plugin-shared-preferences";
  private static final String XML_SUFFIX = ".xml";
  private StatoConnection mConnection;
  private final Map<SharedPreferences, SharedPreferencesDescriptor> mSharedPreferences;
  private final SharedPreferences.OnSharedPreferenceChangeListener
      onSharedPreferenceChangeListener =
          new SharedPreferences.OnSharedPreferenceChangeListener() {
            @Override
            public void onSharedPreferenceChanged(SharedPreferences sharedPreferences, String key) {
              if (mConnection == null) {
                return;
              }
              SharedPreferencesDescriptor descriptor = mSharedPreferences.get(sharedPreferences);
              if (descriptor == null) {
                return;
              }
              mConnection.send(
                  "sharedPreferencesChange",
                  new StatoObject.Builder()
                      .put("preferences", descriptor.name)
                      .put("name", key)
                      .put("deleted", !sharedPreferences.contains(key))
                      .put("time", System.currentTimeMillis())
                      .put("value", sharedPreferences.getAll().get(key))
                      .build());
            }
          };

  /**
   * Creates a {@link android.content.SharedPreferences} plugin for Stato
   *
   * @param context The context to retrieve the file from. Will use the package name as the file
   *     name with {@link Context#MODE_PRIVATE}.
   */
  public SharedPreferencesStatoPlugin(Context context) {
    this(context, buildDescriptorForAllPrefsFiles(context));
  }

  /**
   * Creates a {@link android.content.SharedPreferences} plugin for Stato
   *
   * @param context The context to retrieve the file from. Will use the name as the file name with
   *     {@link Context#MODE_PRIVATE}.
   * @param name The preference file name.
   */
  public SharedPreferencesStatoPlugin(Context context, String name) {
    this(context, name, MODE_PRIVATE);
  }

  /**
   * Creates a {@link android.content.SharedPreferences} plugin for Stato
   *
   * @param context The context to retrieve the file from.
   * @param name The preference file name.
   * @param mode The Context mode to utilize.
   */
  public SharedPreferencesStatoPlugin(Context context, String name, int mode) {
    this(context, Arrays.asList(new SharedPreferencesDescriptor(name, mode)));
  }

  /**
   * Creates a {@link android.content.SharedPreferences} plugin for Stato
   *
   * @param context The context to retrieve the preferences from.
   * @param descriptors A list of {@link SharedPreferencesDescriptor}s that describe the list of
   *     preferences to retrieve.
   */
  public SharedPreferencesStatoPlugin(
      Context context, List<SharedPreferencesDescriptor> descriptors) {
    if (context == null) {
      throw new IllegalArgumentException("Given null context");
    }
    mSharedPreferences = new HashMap<>(descriptors.size());
    for (SharedPreferencesDescriptor descriptor : descriptors) {
      SharedPreferences preferences =
          context.getSharedPreferences(descriptor.name, descriptor.mode);
      preferences.registerOnSharedPreferenceChangeListener(onSharedPreferenceChangeListener);
      mSharedPreferences.put(preferences, descriptor);
    }
  }

  @Override
  public String getId() {
    return "Preferences";
  }

  private static List<SharedPreferencesDescriptor> buildDescriptorForAllPrefsFiles(
      Context context) {
    File dir = new File(context.getApplicationInfo().dataDir, SHARED_PREFS_DIR);
    String[] list =
        dir.list(
            new FilenameFilter() {
              @Override
              public boolean accept(File dir, String name) {
                return name.endsWith(XML_SUFFIX);
              }
            });
    List<SharedPreferencesDescriptor> descriptors = new ArrayList<>();
    if (list != null) {
      for (String each : list) {
        String prefName = each.substring(0, each.indexOf(XML_SUFFIX));
        descriptors.add(new SharedPreferencesDescriptor(prefName, MODE_PRIVATE));
      }
    }
    return descriptors;
  }

  private SharedPreferences getSharedPreferencesFor(String name) {
    for (Map.Entry<SharedPreferences, SharedPreferencesDescriptor> entry :
        mSharedPreferences.entrySet()) {
      if (entry.getValue().name.equals(name)) {
        return entry.getKey();
      }
    }
    throw new IllegalStateException("Unknown shared preferences " + name);
  }

  private StatoObject getStatoObjectFor(String name) {
    return getStatoObjectFor(getSharedPreferencesFor(name));
  }

  private StatoObject getStatoObjectFor(SharedPreferences sharedPreferences) {
    StatoObject.Builder builder = new StatoObject.Builder();
    Map<String, ?> map = sharedPreferences.getAll();
    for (Map.Entry<String, ?> entry : map.entrySet()) {
      final Object val = entry.getValue();
      builder.put(entry.getKey(), val);
    }
    return builder.build();
  }

  @Override
  public void onConnect(StatoConnection connection) {
    mConnection = connection;

    connection.receive(
        "getAllSharedPreferences",
        new StatoReceiver() {
          @Override
          public void onReceive(StatoObject params, StatoResponder responder) {
            StatoObject.Builder builder = new StatoObject.Builder();
            for (Map.Entry<SharedPreferences, SharedPreferencesDescriptor> entry :
                mSharedPreferences.entrySet()) {
              builder.put(entry.getValue().name, getStatoObjectFor(entry.getKey()));
            }
            responder.success(builder.build());
          }
        });

    connection.receive(
        "getSharedPreferences",
        new StatoReceiver() {
          @Override
          public void onReceive(StatoObject params, StatoResponder responder) {
            String name = params.getString("name");
            if (name != null) {
              responder.success(getStatoObjectFor(name));
            }
          }
        });

    connection.receive(
        "setSharedPreference",
        new StatoReceiver() {
          @Override
          public void onReceive(StatoObject params, StatoResponder responder)
              throws IllegalArgumentException {
            String sharedPreferencesName = params.getString("sharedPreferencesName");
            String preferenceName = params.getString("preferenceName");
            SharedPreferences sharedPrefs = getSharedPreferencesFor(sharedPreferencesName);
            Object originalValue = sharedPrefs.getAll().get(preferenceName);
            SharedPreferences.Editor editor = sharedPrefs.edit();

            if (originalValue instanceof Boolean) {
              editor.putBoolean(preferenceName, params.getBoolean("preferenceValue"));
            } else if (originalValue instanceof Long) {
              editor.putLong(preferenceName, params.getLong("preferenceValue"));
            } else if (originalValue instanceof Integer) {
              editor.putInt(preferenceName, params.getInt("preferenceValue"));
            } else if (originalValue instanceof Float) {
              editor.putFloat(preferenceName, params.getFloat("preferenceValue"));
            } else if (originalValue instanceof String) {
              editor.putString(preferenceName, params.getString("preferenceValue"));
            } else {
              throw new IllegalArgumentException("Type not supported: " + preferenceName);
            }

            editor.apply();

            responder.success(getStatoObjectFor(sharedPreferencesName));
          }
        });
  }

  @Override
  public void onDisconnect() {
    mConnection = null;
  }

  @Override
  public boolean runInBackground() {
    return false;
  }

  public static class SharedPreferencesDescriptor {
    public final String name;
    public final int mode;

    public SharedPreferencesDescriptor(String name, int mode) {
      if (name == null || name.length() == 0) {
        throw new IllegalArgumentException("Given null or empty name");
      }
      this.name = name;
      this.mode = mode;
    }
  }
}
