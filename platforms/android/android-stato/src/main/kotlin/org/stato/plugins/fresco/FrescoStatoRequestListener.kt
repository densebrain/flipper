/*
 *  Copyright (c) 2004-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package org.stato.plugins.fresco

import com.facebook.imagepipeline.debug.DebugImageTracker
import com.facebook.imagepipeline.listener.BaseRequestListener
import com.facebook.imagepipeline.request.ImageRequest

/** Fresco image [RequestListener] that logs events for Sonar.  */
class FrescoStatoRequestListener(private val debugImageTracker: DebugImageTracker) : BaseRequestListener() {

  override fun onRequestStart(
    request: ImageRequest,
    callerContext: Any,
    requestId: String,
    isPrefetch: Boolean
  ) {
    debugImageTracker.trackImageRequest(request, requestId)
  }
}
