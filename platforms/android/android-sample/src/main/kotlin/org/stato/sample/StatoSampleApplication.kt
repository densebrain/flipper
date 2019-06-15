/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package org.stato.sample

import android.app.Application
import android.content.Context
import com.facebook.drawee.backends.pipeline.Fresco
import com.facebook.litho.config.ComponentsConfiguration
import com.facebook.soloader.SoLoader
import com.squareup.leakcanary.LeakCanary
import okhttp3.OkHttpClient
import org.densebrain.android.logging.DroidLogger
import org.densebrain.android.logging.error
import org.stato.android.AndroidStatoClientManager
import org.stato.plugins.console.JavascriptEnvironment
import org.stato.plugins.crashreporter.CrashReporterPlugin
import org.stato.plugins.example.ExampleStatoPlugin
import org.stato.plugins.fresco.FrescoStatoPlugin
import org.stato.plugins.inspector.DescriptorMapping
import org.stato.plugins.inspector.InspectorStatoPlugin
import org.stato.plugins.leakcanary.LeakCanaryStatoPlugin
import org.stato.plugins.litho.LithoStatoDescriptors
import org.stato.plugins.network.NetworkStatoPlugin
import org.stato.plugins.network.StatoOkHttpInterceptor
import org.stato.plugins.sharedpreferences.SharedPreferencesStatoPlugin
import org.stato.plugins.sharedpreferences.SharedPreferencesStatoPlugin.SharedPreferencesDescriptor
import java.util.concurrent.TimeUnit

class StatoSampleApplication : Application(), DroidLogger {


  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, false)


    if (LeakCanary.isInAnalyzerProcess(this)) {
      // This process is dedicated to LeakCanary for heap analysis.
      // You should not init your app in this process.
      return
    }

    LeakCanary.install(this)
    Fresco.initialize(this)

    try {
      val clientBuilder = AndroidStatoClientManager.Builder(this)
      val descriptorMapping = DescriptorMapping.withDefaults()
      val networkPlugin = NetworkStatoPlugin()
      val interceptor = StatoOkHttpInterceptor(networkPlugin)

      NetworkManager.okHttpClient = OkHttpClient.Builder()
        .addNetworkInterceptor(interceptor)
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(10, TimeUnit.MINUTES)
        .build()

      // Normally, you would want to make this dependent on a BuildConfig flag, but
      // for this demo application we can safely assume that you always want to debug.
      ComponentsConfiguration.isDebugModeEnabled = true
      LithoStatoDescriptors.add(descriptorMapping)
      clientBuilder
        .withDefaultAddress()
        .withPlugins(
          //new ConsoleStatoPlugin(new JavascriptEnvironment()),
          InspectorStatoPlugin(this, descriptorMapping, JavascriptEnvironment()),
          networkPlugin,
          SharedPreferencesStatoPlugin(
            this,
            listOf(
              SharedPreferencesDescriptor("sample", Context.MODE_PRIVATE),
              SharedPreferencesDescriptor("other_sample", Context.MODE_PRIVATE)
            )
          ),
          LeakCanaryStatoPlugin(),
          FrescoStatoPlugin(),
          ExampleStatoPlugin(),
          CrashReporterPlugin.instance
        ).start()

    } catch (ex: Exception) {
      error("Unable to configure stato", ex)
    }

    // Add some sample data
    getSharedPreferences("sample", Context.MODE_PRIVATE).edit().putString("Hello", "world").apply()
    getSharedPreferences("other_sample", Context.MODE_PRIVATE)
      .edit()
      .putInt("SomeKey", 1337)
      .apply()
  }

}
