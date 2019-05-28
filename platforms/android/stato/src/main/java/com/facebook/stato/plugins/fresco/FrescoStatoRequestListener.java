/*
 *  Copyright (c) 2004-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package com.facebook.stato.plugins.fresco;

import com.facebook.imagepipeline.debug.DebugImageTracker;
import com.facebook.imagepipeline.listener.BaseRequestListener;
import com.facebook.imagepipeline.request.ImageRequest;

/** Fresco image {@link RequestListener} that logs events for Sonar. */
public class FrescoStatoRequestListener extends BaseRequestListener {

  private final DebugImageTracker mDebugImageTracker;

  public FrescoStatoRequestListener(DebugImageTracker debugImageTracker) {
    mDebugImageTracker = debugImageTracker;
  }

  @Override
  public void onRequestStart(
      ImageRequest request, Object callerContext, String requestId, boolean isPrefetch) {
    mDebugImageTracker.trackImageRequest(request, requestId);
  }
}
