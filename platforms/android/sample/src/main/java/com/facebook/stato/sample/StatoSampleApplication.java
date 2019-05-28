/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.stato.sample;

import android.app.Application;
import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.stato.android.AndroidStatoClient;
import com.facebook.stato.plugins.console.JavascriptEnvironment;
import com.facebook.stato.plugins.crashreporter.CrashReporterPlugin;
import com.facebook.stato.plugins.example.ExampleStatoPlugin;
import com.facebook.stato.plugins.fresco.FrescoStatoPlugin;
import com.facebook.stato.plugins.inspector.DescriptorMapping;
import com.facebook.stato.plugins.inspector.InspectorStatoPlugin;
import com.facebook.stato.plugins.leakcanary.LeakCanaryStatoPlugin;
import com.facebook.stato.plugins.litho.LithoStatoDescriptors;
import com.facebook.stato.plugins.network.StatoOkHttpInterceptor;
import com.facebook.stato.plugins.network.NetworkStatoPlugin;
import com.facebook.stato.plugins.sharedpreferences.SharedPreferencesStatoPlugin;
import com.facebook.stato.plugins.sharedpreferences.SharedPreferencesStatoPlugin.SharedPreferencesDescriptor;
import com.facebook.litho.config.ComponentsConfiguration;
import com.facebook.soloader.SoLoader;
import com.squareup.leakcanary.LeakCanary;

import java.util.Arrays;
import java.util.concurrent.TimeUnit;

import okhttp3.OkHttpClient;

public class StatoSampleApplication extends Application {

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
      final AndroidStatoClient.Builder clientBuilder = new AndroidStatoClient.Builder(this);

      final DescriptorMapping descriptorMapping = DescriptorMapping.withDefaults();

      final NetworkStatoPlugin networkPlugin = new NetworkStatoPlugin();
      final StatoOkHttpInterceptor interceptor = new StatoOkHttpInterceptor(networkPlugin);

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
      LithoStatoDescriptors.add(descriptorMapping);
      clientBuilder
        .withDefaultAddress()
        .withPlugins(
          //new ConsoleStatoPlugin(new JavascriptEnvironment()),
          new InspectorStatoPlugin(this, descriptorMapping,new JavascriptEnvironment()),
          networkPlugin,
          new SharedPreferencesStatoPlugin(
            this,
            Arrays.asList(
              new SharedPreferencesDescriptor("sample", Context.MODE_PRIVATE),
              new SharedPreferencesDescriptor("other_sample", Context.MODE_PRIVATE))),
          new LeakCanaryStatoPlugin(),
          new FrescoStatoPlugin(),
          new ExampleStatoPlugin(),
          CrashReporterPlugin.getInstance()
        ).start();

    } catch (Exception ex) {
      Log.e(getClass().getName(), "Unable to configure stato", ex);
    }
    getSharedPreferences("sample", Context.MODE_PRIVATE).edit().putString("Hello", "world").apply();
    getSharedPreferences("other_sample", Context.MODE_PRIVATE)
      .edit()
      .putInt("SomeKey", 1337)
      .apply();
  }
}
