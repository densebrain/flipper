/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package org.stato.plugins.network

import android.util.Base64
import org.stato.core.StatoArray
import org.stato.core.StatoObject
import org.stato.core.runOrThrow
import org.stato.plugins.common.BufferingStatoPlugin

class NetworkStatoPlugin(private val formatters: List<NetworkResponseFormatter>? = null) : BufferingStatoPlugin(), NetworkReporter {

  override val id = ID

  override fun reportRequest(requestInfo: NetworkReporter.RequestInfo) {
    val request = StatoObject.Builder()
      .put("id", requestInfo.requestId)
      .put("timestamp", requestInfo.timeStamp)
      .put("method", requestInfo.method)
      .put("url", requestInfo.uri)
      .put("headers", toStatoObject(requestInfo.headers))
      .put("data", toBase64(requestInfo.body))
      .build()

    send("newRequest", request)
  }

  override fun reportResponse(responseInfo: NetworkReporter.ResponseInfo) {
    connection?.let { connection ->
      val job = connection.runOrThrow<Unit> {

        if (shouldStripResponseBody(responseInfo)) {
          responseInfo.body = null
        }

        val response = StatoObject.Builder()
          .put("id", responseInfo.requestId)
          .put("timestamp", responseInfo.timeStamp)
          .put("status", responseInfo.statusCode)
          .put("reason", responseInfo.statusReason)
          .put("headers", toStatoObject(responseInfo.headers))
          .put("data", toBase64(responseInfo.body))
          .build()

        send("newResponse", response)
      }


      formatters
        ?.find { formatter -> formatter.shouldFormat(responseInfo) }
        ?.let { formatter ->
          formatter.format(responseInfo) { json: String ->
            responseInfo.body = json.toByteArray()
            job.run()

          }
          true
        }
        ?: job.run()
    }

  }

  private fun toBase64(bytes: ByteArray?): String? {
    return if (bytes == null) {
      null
    } else String(Base64.encode(bytes, Base64.DEFAULT))
  }

  private fun toStatoObject(headers: List<NetworkReporter.Header>): StatoArray {
    val list = StatoArray.Builder()

    for (header in headers) {
      list.put(StatoObject.Builder().put("key", header.name).put("value", header.value))
    }

    return list.build()
  }

  companion object {
    val ID = "@stato/plugin-network"

    private fun shouldStripResponseBody(responseInfo: NetworkReporter.ResponseInfo): Boolean {
      val contentType = responseInfo.getFirstHeader("content-type") ?: return false

      return (contentType.value.contains("image/")
        || contentType.value.contains("video/")
        || contentType.value.contains("application/zip"))
    }
  }
}
