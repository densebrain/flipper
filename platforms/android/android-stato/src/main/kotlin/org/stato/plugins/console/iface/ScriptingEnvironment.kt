/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.plugins.console.iface

interface ScriptingEnvironment {

  val isEnabled: Boolean

  fun startSession(): ScriptingSession

  fun registerGlobalObject(name: String, obj: Any)
}
