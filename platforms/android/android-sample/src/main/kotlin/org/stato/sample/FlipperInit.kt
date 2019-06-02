package org.stato.sample

import android.app.Application
import android.content.Context
import android.util.Log
import com.facebook.drawee.backends.pipeline.Fresco
import com.facebook.litho.config.ComponentsConfiguration
import com.squareup.leakcanary.LeakCanary
import okhttp3.OkHttpClient
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

import java.util.*
import java.util.concurrent.TimeUnit

internal object NetworkManager {
  var okHttpClient: OkHttpClient? = null

  val httpClient: OkHttpClient
    get() {
      if (okHttpClient == null)
        throw IllegalStateException("OkHttpClient has not been initialized yet")
      return okHttpClient!!
    }
}

fun flipperInit(app: Application) = with(app) {

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
        InspectorStatoPlugin(app, descriptorMapping, JavascriptEnvironment()),
        networkPlugin,
        SharedPreferencesStatoPlugin(
          this,
          Arrays.asList<SharedPreferencesDescriptor>(
            SharedPreferencesDescriptor("sample", Context.MODE_PRIVATE),
            SharedPreferencesDescriptor("other_sample", Context.MODE_PRIVATE))),
        LeakCanaryStatoPlugin(),
        FrescoStatoPlugin(),
        ExampleStatoPlugin(),
        CrashReporterPlugin.instance
      ).start()

  } catch (ex: Exception) {
    Log.e(javaClass.getName(), "Unable to configure stato", ex)
  }

  getSharedPreferences("sample", Context.MODE_PRIVATE).edit().putString("Hello", "world").apply()
  getSharedPreferences("other_sample", Context.MODE_PRIVATE)
    .edit()
    .putInt("SomeKey", 1337)
    .apply()
}