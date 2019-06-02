/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
package org.stato.perflogger

class NoOpStatoPerfLogger : StatoPerfLogger {

    override fun startMarker(name: String) {
  }

    override fun endMarker(name: String) {
  }

    override fun cancelMarker(name: String) {
  }
}
