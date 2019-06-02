/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package org.stato.plugins.network

import org.stato.plugins.network.NetworkReporter.ResponseInfo

typealias OnCompletionListener = (json: String) -> Unit

interface NetworkResponseFormatter {

  fun shouldFormat(response: ResponseInfo): Boolean

  fun format(response: ResponseInfo, onCompletionListener: OnCompletionListener)
}
