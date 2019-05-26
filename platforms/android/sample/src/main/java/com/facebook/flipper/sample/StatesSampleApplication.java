/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.states.sample;

import android.app.Application;
import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.states.android.AndroidStatesClient;
import com.facebook.states.plugins.console.JavascriptEnvironment;
import com.facebook.states.plugins.crashreporter.CrashReporterPlugin;
import com.facebook.states.plugins.example.ExampleStatesPlugin;
import com.facebook.states.plugins.fresco.FrescoStatesPlugin;
import com.facebook.states.plugins.inspector.DescriptorMapping;
import com.facebook.states.plugins.inspector.InspectorStatesPlugin;
import com.facebook.states.plugins.leakcanary.LeakCanaryStatesPlugin;
import com.facebook.states.plugins.litho.LithoStatesDescriptors;
import com.facebook.states.plugins.network.StatesOkHttpInterceptor;
import com.facebook.states.plugins.network.NetworkStatesPlugin;
import com.facebook.states.plugins.sharedpreferences.SharedPreferencesStatesPlugin;
import com.facebook.states.plugins.sharedpreferences.SharedPreferencesStatesPlugin.SharedPreferencesDescriptor;
import com.facebook.litho.config.ComponentsConfiguration;
import com.facebook.soloader.SoLoader;
import com.squareup.leakcanary.LeakCanary;

import java.util.Arrays;
import java.util.concurrent.TimeUnit;

import okhttp3.OkHttpClient;

public class StatesSampleApplication extends Application {

  @Nullable
  private static OkHttpClient sOkHttpClient = null;

  @NonNull
  public static OkHttpClient getHttpClient() {
    if (sOkHttpClient == null)
      throw new IllegalStateException("OkHttpClient has not been initialized yet");
    return sOkHttpClient;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    if (LeakCanary.isInAnalyzerProcess(this)) {
      // This process is dedicated to LeakCanary for heap analysis.
      // You should not init your app in this process.
      return;
    }
    LeakCanary.install(this);

    SoLoader.init(this, false);
    Fresco.initialize(this);

    try {
      final AndroidStatesClient.Builder clientBuilder = new AndroidStatesClient.Builder(this);

      final DescriptorMapping descriptorMapping = DescriptorMapping.withDefaults();

      final NetworkStatesPlugin networkPlugin = new NetworkStatesPlugin();
      final StatesOkHttpInterceptor interceptor = new StatesOkHttpInterceptor(networkPlugin);

      sOkHttpClient =
        new OkHttpClient.Builder()
          .addNetworkInterceptor(interceptor)
          .connectTimeout(60, TimeUnit.SECONDS)
          .readTimeout(60, TimeUnit.SECONDS)
          .writeTimeout(10, TimeUnit.MINUTES)
          .build();

      // Normally, you would want to make this dependent on a BuildConfig flag, but
      // for this demo application we can safely assume that you always want to debug.
      ComponentsConfiguration.isDebugModeEnabled = true;
      LithoStatesDescriptors.add(descriptorMapping);
      clientBuilder
        .withDefaultAddress()
        .withPlugins(
          //new ConsoleStatesPlugin(new JavascriptEnvironment()),
          new InspectorStatesPlugin(this, descriptorMapping,new JavascriptEnvironment()),
          networkPlugin,
          new SharedPreferencesStatesPlugin(
            this,
            Arrays.asList(
              new SharedPreferencesDescriptor("sample", Context.MODE_PRIVATE),
              new SharedPreferencesDescriptor("other_sample", Context.MODE_PRIVATE))),
          new LeakCanaryStatesPlugin(),
          new FrescoStatesPlugin(),
          new ExampleStatesPlugin(),
          CrashReporterPlugin.getInstance()
        ).start();

    } catch (Exception ex) {
      Log.e(getClass().getName(), "Unable to configure states", ex);
    }
    getSharedPreferences("sample", Context.MODE_PRIVATE).edit().putString("Hello", "world").apply();
    getSharedPreferences("other_sample", Context.MODE_PRIVATE)
      .edit()
      .putInt("SomeKey", 1337)
      .apply();
  }
}
