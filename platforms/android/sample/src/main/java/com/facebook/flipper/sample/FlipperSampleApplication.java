/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.flipper.sample;

import android.app.Application;
import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.drawee.backends.pipeline.Fresco;
import com.facebook.flipper.android.AndroidFlipperClient;
import com.facebook.flipper.plugins.console.JavascriptEnvironment;
import com.facebook.flipper.plugins.crashreporter.CrashReporterPlugin;
import com.facebook.flipper.plugins.example.ExampleFlipperPlugin;
import com.facebook.flipper.plugins.fresco.FrescoFlipperPlugin;
import com.facebook.flipper.plugins.inspector.DescriptorMapping;
import com.facebook.flipper.plugins.inspector.InspectorFlipperPlugin;
import com.facebook.flipper.plugins.leakcanary.LeakCanaryFlipperPlugin;
import com.facebook.flipper.plugins.litho.LithoFlipperDescriptors;
import com.facebook.flipper.plugins.network.FlipperOkHttpInterceptor;
import com.facebook.flipper.plugins.network.NetworkFlipperPlugin;
import com.facebook.flipper.plugins.sharedpreferences.SharedPreferencesFlipperPlugin;
import com.facebook.flipper.plugins.sharedpreferences.SharedPreferencesFlipperPlugin.SharedPreferencesDescriptor;
import com.facebook.litho.config.ComponentsConfiguration;
import com.facebook.soloader.SoLoader;
import com.squareup.leakcanary.LeakCanary;

import java.util.Arrays;
import java.util.concurrent.TimeUnit;

import okhttp3.OkHttpClient;

public class FlipperSampleApplication extends Application {

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
      final AndroidFlipperClient.Builder clientBuilder = new AndroidFlipperClient.Builder(this);

      final DescriptorMapping descriptorMapping = DescriptorMapping.withDefaults();

      final NetworkFlipperPlugin networkPlugin = new NetworkFlipperPlugin();
      final FlipperOkHttpInterceptor interceptor = new FlipperOkHttpInterceptor(networkPlugin);

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
      LithoFlipperDescriptors.add(descriptorMapping);
      clientBuilder
        .withDefaultAddress()
        .withPlugins(
          //new ConsoleFlipperPlugin(new JavascriptEnvironment()),
          new InspectorFlipperPlugin(this, descriptorMapping,new JavascriptEnvironment()),
          networkPlugin,
          new SharedPreferencesFlipperPlugin(
            this,
            Arrays.asList(
              new SharedPreferencesDescriptor("sample", Context.MODE_PRIVATE),
              new SharedPreferencesDescriptor("other_sample", Context.MODE_PRIVATE))),
          new LeakCanaryFlipperPlugin(),
          new FrescoFlipperPlugin(),
          new ExampleFlipperPlugin(),
          CrashReporterPlugin.getInstance()
        ).start();

    } catch (Exception ex) {
      Log.e(getClass().getName(), "Unable to configure flipper", ex);
    }
    getSharedPreferences("sample", Context.MODE_PRIVATE).edit().putString("Hello", "world").apply();
    getSharedPreferences("other_sample", Context.MODE_PRIVATE)
      .edit()
      .putInt("SomeKey", 1337)
      .apply();
  }
}
