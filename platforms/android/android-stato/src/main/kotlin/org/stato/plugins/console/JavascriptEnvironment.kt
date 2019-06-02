/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.plugins.console

import org.stato.plugins.console.iface.ScriptingEnvironment
import java.util.HashMap
import org.mozilla.javascript.Context
import org.mozilla.javascript.ContextFactory

class JavascriptEnvironment : ScriptingEnvironment {

  private val boundVariables = mutableMapOf<String, Any>()
  private val contextFactory: ContextFactory

  override val isEnabled= true

  init {
    contextFactory = object : ContextFactory() {
            override fun hasFeature(cx: Context, featureIndex: Int): Boolean {
        return featureIndex == Context.FEATURE_ENHANCED_JAVA_ACCESS
      }
    }
  }

    override fun startSession(): JavascriptSession {
    return JavascriptSession(contextFactory, boundVariables)
  }

  /**
   * Method for other plugins to register objects to a name, so that they can be accessed in all
   * console sessions.
   *
   * @param name The variable name to bind the object to.
   * @param object The reference to bind.
   */
    override fun registerGlobalObject(name: String, obj: Any) {
    if (boundVariables.containsKey(name)) {
      throw IllegalStateException(
        String.format("Variable %s is already reserved for %s", name, boundVariables[name]))
    }
    boundVariables[name] = obj
  }
}
