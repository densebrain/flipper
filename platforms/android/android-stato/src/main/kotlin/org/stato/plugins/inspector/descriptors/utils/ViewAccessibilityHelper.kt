/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package org.stato.plugins.inspector.descriptors.utils

import android.view.View
import androidx.core.view.ViewCompat
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat

/** Class that helps with accessibility by providing useful methods.  */
object ViewAccessibilityHelper {

  /**
   * Creates and returns an [AccessibilityNodeInfoCompat] from the the provided [View].
   * Note: This does not handle recycling of the [AccessibilityNodeInfoCompat].
   *
   * @param view The [View] to create the [AccessibilityNodeInfoCompat] from.
   * @return [AccessibilityNodeInfoCompat]
   */

  fun createNodeInfoFromView(view: View?): AccessibilityNodeInfoCompat? {
    if (view == null) {
      return null
    }

    val nodeInfo = AccessibilityNodeInfoCompat.obtain()

    // For some unknown reason, Android seems to occasionally throw a NPE from
    // onInitializeAccessibilityNodeInfo.
    try {
      ViewCompat.onInitializeAccessibilityNodeInfo(view, nodeInfo)
    } catch (e: NullPointerException) {
      if (nodeInfo != null) {
        nodeInfo!!.recycle()
      }
      return null
    }

    return nodeInfo
  }
}
