/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package org.stato.plugins.inspector

import android.graphics.Rect
import android.os.Build
import android.util.Log
import android.view.View
import org.densebrain.android.logging.DroidLogger
import org.densebrain.android.logging.debug
import org.densebrain.android.logging.info

/**
 * A singleton instance of a overlay drawable used for highlighting node bounds. See [ ][NodeDescriptor.setHighlighted].
 */
object HighlightedOverlay : DroidLogger {
  private val VIEW_OVERLAY_SUPPORT = Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR2

  /**
   * Highlights a particular view with its content bounds, padding and margin dimensions
   *
   * @param targetView The view to apply the highlight on
   * @param margin A [Rect] containing the margin values
   * @param padding A [Rect] containing the padding values
   * @param contentBounds The [Rect] bounds of the content, which includes padding
   */
  fun setHighlighted(
    targetView: View,
    inMargin: Rect,
    inPadding: Rect,
    contentBounds: Rect,
    isAlignmentMode: Boolean
  ) {
    if (!VIEW_OVERLAY_SUPPORT) {
      return
    }

    contentBounds.set(
      contentBounds.left + inPadding.left,
      contentBounds.top + inPadding.top,
      contentBounds.right - inPadding.right,
      contentBounds.bottom - inPadding.bottom)

    val padding = enclose(inPadding, contentBounds)
    val margin = enclose(inMargin, inPadding)

    debug("Setting highlight: ${contentBounds}")

    val density = targetView.context.resources.displayMetrics.density
    val fillOverlay = BoundsDrawable.getInstance(targetView, density, margin, padding, Rect(contentBounds))

    debug("Class ${targetView.javaClass.simpleName}/${targetView.id} highlight: ${contentBounds}")
    targetView.setLayerType(View.LAYER_TYPE_SOFTWARE, null)

    targetView.overlay.add(fillOverlay)
    if (isAlignmentMode) {
      val coords = IntArray(2)
      targetView.getLocationOnScreen(coords)
      val lineContentBounds = Rect(
        coords[0] + contentBounds.left,
        coords[1] + contentBounds.top,
        coords[0] + contentBounds.right,
        coords[1] + contentBounds.bottom
      )

      val lineOverlay = LinesDrawable.getInstance(targetView, density, margin, padding, lineContentBounds)

      targetView.rootView.overlay.add(lineOverlay)
    }
  }

  fun removeHighlight(targetView: View) {
    if (!VIEW_OVERLAY_SUPPORT) {
      return
    }

    debug("Removing highlight ${targetView.width}x${targetView.height}@${targetView.id}")

    val density = targetView.context.resources.displayMetrics.density
    val fillOverlay = BoundsDrawable.getInstance(targetView, density)
    val linesOverlay = LinesDrawable.getInstance(targetView, density)
    targetView.rootView.overlay.remove(linesOverlay)
    targetView.overlay.remove(fillOverlay)
    targetView.setLayerType(View.LAYER_TYPE_NONE, null)
  }

  private fun enclose(parent: Rect, child: Rect): Rect {
    return Rect(
      child.left - parent.left,
      child.top - parent.top,
      child.right + parent.right,
      child.bottom + parent.bottom)
  }
}
