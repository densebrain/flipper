package org.stato.sample

import okhttp3.OkHttpClient

/**
 * Network interceptor
 */
object NetworkManager {
  var okHttpClient: OkHttpClient? = null

  val httpClient: OkHttpClient
    get() {
      if (okHttpClient == null)
        throw IllegalStateException("OkHttpClient has not been initialized yet")
      return okHttpClient!!
    }
}