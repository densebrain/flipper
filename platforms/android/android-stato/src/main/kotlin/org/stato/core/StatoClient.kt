/*
 *  Copyright (c) Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.core

import kotlin.reflect.KClass

interface StatoClient {

  val state: String

  val stateSummary: StateSummary

  fun init(config: StatoClientConfig)

  fun addPlugin(plugin: StatoPlugin)

  fun <T : StatoPlugin> getPlugin(id: String): T?

  fun <T : StatoPlugin> getPluginByClass(cls: Class<T>): T?

  //fun <P : StatoPlugin> getPluginByFactory(cls: KClass<StatoPluginFactory<P>>): P?

  fun removePlugin(plugin: StatoPlugin)

  fun start()

  fun stop()

  fun subscribeForUpdates(stateListener: StatoStateUpdateListener)

  fun unsubscribe()
}



//,
inline fun <reified P : StatoPlugin> StatoClient.getPlugin():P? = getPluginByClass(P::class.java)