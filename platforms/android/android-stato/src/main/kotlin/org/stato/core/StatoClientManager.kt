package org.stato.core

import kotlin.properties.Delegates

object StatoClientManager {

  var factory by Delegates.observable<StatoClientFactory>(StatoDefaultClientFactory) { _, _, _ ->

  }

  fun getClient(): StatoClient {
    return factory.getClient()
  }



}