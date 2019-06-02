/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
@file:Suppress("MemberVisibilityCanBePrivate", "ConstantConditionIf")

package org.stato.core

import androidx.annotation.Keep
import com.facebook.jni.HybridClassBase
import org.stato.BuildConfig
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.soloader.SoLoader
import org.stato.core.util.getOrPut
import java.util.concurrent.atomic.AtomicReference

@DoNotStrip
@Keep
@Suppress("unused")

object StatoDefaultClientFactory : HybridClassBase(), StatoClientFactory {
  init {
    initHybrid()
  }
  @DoNotStrip
  @Keep
  private external fun initHybrid()

  @Keep
  private external fun makeDefaultClient(): StatoDefaultClient

  private val clientRef = AtomicReference<StatoDefaultClient>(null)

  override fun getClient(): StatoClient {
    return clientRef.getOrPut { makeDefaultClient() }
  }





}

class StatoDefaultClient private constructor(private val hybridData: HybridData) : StatoClient {
  private val classIdentifierMap = mutableMapOf<Class<StatoPlugin>, String>()

  override val state: String
    @Keep external get


  override val stateSummary: StateSummary
    @Keep external get

  override fun addPlugin(plugin: StatoPlugin) {
    classIdentifierMap[plugin.javaClass] = plugin.id
    addPluginNative(plugin)
  }

  @Keep
  external fun addPluginNative(plugin: StatoPlugin)


  @Deprecated("Prefer using {@link #getPluginByClass(Class)} over the stringly-typed interface.")
  @Keep
  external override fun <T : StatoPlugin> getPlugin(id: String): T?

  @Suppress("UNCHECKED_CAST")
  override fun <T : StatoPlugin> getPluginByClass(cls: Class<T>): T? {
    val id = classIdentifierMap[cls as Class<StatoPlugin>]

    return id?.let { getPlugin(it) }
  }

  @Keep
  external fun removePluginNative(plugin: StatoPlugin)

  override fun removePlugin(plugin: StatoPlugin) {
    classIdentifierMap.remove(plugin.javaClass)
    removePluginNative(plugin)
  }

  @Keep
  external override fun start()

  @Keep
  external override fun stop()

  @Keep
  external override fun subscribeForUpdates(stateListener: StatoStateUpdateListener)

  @Keep
  external override fun unsubscribe()


  override fun init(config: StatoClientConfig) {
    with(config) {
      initNative(
        callbackWorker,
        connectionWorker,
        insecurePort,
        securePort,
        host,
        os,
        device,
        deviceId,
        app,
        appId,
        privateAppDirectory
      )
    }
  }

  @Keep
  private external fun initNative(
    callbackWorker: StatoEventBase,
    connectionWorker: StatoEventBase,
    insecurePort: Int,
    securePort: Int,
    host: String,
    os: String,
    device: String,
    deviceId: String,
    app: String,
    appId: String,
    privateAppDirectory: String)

  companion object {
    init {
      if (BuildConfig.IS_INTERNAL_BUILD) {
        SoLoader.loadLibrary("android-stato")
      }
    }
  }
}