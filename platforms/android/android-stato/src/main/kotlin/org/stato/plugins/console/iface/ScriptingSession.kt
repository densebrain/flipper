/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.plugins.console.iface

import org.json.JSONException
import org.json.JSONObject

interface ScriptingSession {

//  @Throws(JSONException::class)
//  fun evaluateCommand(userScript: String): JSONObject

  @Throws(JSONException::class)
  fun evaluateCommand(userScript: String, context: Any? = null): JSONObject

  fun close()
}
