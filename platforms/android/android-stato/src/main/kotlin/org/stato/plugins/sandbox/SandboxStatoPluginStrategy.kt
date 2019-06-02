/*
 *  Copyright (c) 2004-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.plugins.sandbox

interface SandboxStatoPluginStrategy {

  val knownSandboxes: Map<String, String>

  fun setSandbox(sandbox: String)
}
