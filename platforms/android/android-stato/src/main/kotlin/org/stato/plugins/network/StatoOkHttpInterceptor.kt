/*
 *  Copyright (c) 2004-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.plugins.network

import org.stato.plugins.network.NetworkReporter.RequestInfo
import org.stato.plugins.network.NetworkReporter.ResponseInfo
import java.io.IOException
import java.util.ArrayList
import java.util.UUID

import okhttp3.Headers
import okhttp3.Interceptor
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.Response
import okhttp3.ResponseBody
import okio.Buffer
import okio.BufferedSource

class StatoOkHttpInterceptor(private val plugin: NetworkStatoPlugin) : Interceptor {


  @Throws(IOException::class)
  override fun intercept(chain: Interceptor.Chain): Response {
    val request = chain.request()
    val identifier = UUID.randomUUID().toString()
    plugin.reportRequest(convertRequest(request, identifier))
    val response = chain.proceed(request)
    response.body()?.let { body ->
      convertResponse(response, body, identifier).apply {
        plugin.reportResponse(this)
      }
    }
    return response

  }

  @Throws(IOException::class)
  private fun bodyToByteArray(request: Request): ByteArray {

    val body = request.body() ?: error("body is null")

    return Buffer().apply {
      body.writeTo(this)
    }.readByteArray()

  }

  @Throws(IOException::class)
  private fun convertRequest(request: Request, identifier: String): RequestInfo {
    val headers = convertHeader(request.headers())
    val info = RequestInfo()
    info.requestId = identifier
    info.timeStamp = System.currentTimeMillis()
    info.headers = headers
    info.method = request.method()
    info.uri = request.url().toString()
    request.body()?.run {
      info.body = bodyToByteArray(request)
    }

    return info
  }

  @Throws(IOException::class)
  private fun convertResponse(response: Response, body: ResponseBody, identifier: String): ResponseInfo {
    val headers = convertHeader(response.headers())
    val info = ResponseInfo()
    info.requestId = identifier
    info.timeStamp = response.receivedResponseAtMillis()
    info.statusCode = response.code()
    info.headers = headers
    val source = body.source()
    source.request(Long.MAX_VALUE)
    val buffer = source.buffer().clone()
    info.body = buffer.readByteArray()
    return info
  }

  private fun convertHeader(headers: Headers): List<NetworkReporter.Header> {
    return headers.names()
      .map { NetworkReporter.Header(it, headers.get(it)!!) }
  }
}
