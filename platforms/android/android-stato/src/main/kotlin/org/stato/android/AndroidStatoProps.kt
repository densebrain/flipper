/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
package org.stato.android

import android.util.Log
import java.io.BufferedReader
import java.io.IOException
import java.io.InputStreamReader
import java.nio.charset.Charset

internal object AndroidStatoProps {

  private const val STATES_PORTS_PROP_NAME = "stato.ports"
  private const val DEFAULT_INSECURE_PORT = 8089
  private const val DEFAULT_SECURE_PORT = 8088
  private const val TAG = "Stato"

  val insecurePort: Int
    get() {
      val propValue = getStatoPortsPropValue()
      return extractIntFromPropValue(propValue, 0, DEFAULT_INSECURE_PORT)
    }

  val securePort: Int
    get() {
      val propValue = getStatoPortsPropValue()
      return extractIntFromPropValue(propValue, 1, DEFAULT_SECURE_PORT)
    }

  private var statoPortsPropValue: String? = null

  fun extractIntFromPropValue(propValue: String?, index: Int, fallback: Int): Int {
    if (propValue != null && propValue.isNotEmpty()) {
      try {
        val values = propValue.split(",")
        if (values.size > index) {
          return Integer.parseInt(values[index])
        }
      } catch (e: NumberFormatException) {
        Log.e(TAG, "Failed to parse stato.ports value: $propValue")
      }

    }
    return fallback
  }

  @Synchronized
  private fun getStatoPortsPropValue(): String {
    val statoPortsPropValue = statoPortsPropValue
    if (statoPortsPropValue != null) {
      return statoPortsPropValue
    }

    var process: Process? = null
    var reader: BufferedReader? = null
    try {
      process = Runtime.getRuntime().exec(arrayOf("/system/bin/getprop", STATES_PORTS_PROP_NAME))
      reader = BufferedReader(
        InputStreamReader(process.inputStream, Charset.forName("UTF-8")))

      var lastLine: String? = null
      var line: String

      while (true) {
        try {
          line = reader.readLine()
          if (line == null)
            break

          lastLine = line
        } catch (ex:Throwable) {
          break
        }
      }

      if (lastLine == null)
        error("No lines read")

      this.statoPortsPropValue = lastLine
      return lastLine
    } catch (e: IOException) {
      Log.e(TAG, "Failed to query for stato.ports prop", e)
      this.statoPortsPropValue = ""
      throw e
    } finally {
      try {
        if (reader != null) {
          reader.close()
        }
      } catch (e: IOException) {
        Log.e(TAG, "Failed to close BufferedReader when reading stato.ports prop", e)
      }

      process?.destroy()
    }

  }
}
