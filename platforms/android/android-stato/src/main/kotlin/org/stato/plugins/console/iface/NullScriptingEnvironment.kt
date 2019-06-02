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

class NullScriptingEnvironment : ScriptingEnvironment {

  override val isEnabled: Boolean = false

  override fun startSession(): ScriptingSession {
    return NoOpScriptingSession()
  }

  override fun registerGlobalObject(name: String, obj: Any) {
  }

  internal class NoOpScriptingSession : ScriptingSession {


    @Throws(JSONException::class)
    override fun evaluateCommand(userScript: String, context: Any?): JSONObject {
      throw UnsupportedOperationException("Console plugin not enabled in this app")
    }

    override fun close() {
    }
  }
}
