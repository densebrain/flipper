/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package org.stato.plugins.network

import java.util.ArrayList

interface NetworkReporter {
  fun reportRequest(requestInfo: RequestInfo)

  fun reportResponse(responseInfo: ResponseInfo)

  class Header(val name: String, val value: String) {

        override fun toString(): String {
      return "Header{$name: $value}"
    }
  }

  class RequestInfo {
    var requestId: String? = null
    var timeStamp: Long = 0
    var headers: List<Header> = ArrayList()
    var method: String? = null
    var uri: String? = null
    var body: ByteArray? = null

    fun getFirstHeader(name: String): Header? {
      return headers.find { name.equals(it.name, ignoreCase = true) }
    }
  }

  class ResponseInfo {
    var requestId: String? = null
    var timeStamp: Long = 0
    var statusCode: Int = 0
    var statusReason: String? = null
    var headers: List<Header> = ArrayList()
    var body: ByteArray? = null

    fun getFirstHeader(name: String): Header? {
      return headers.find { name.equals(it.name, ignoreCase = true) }

    }
  }
}
