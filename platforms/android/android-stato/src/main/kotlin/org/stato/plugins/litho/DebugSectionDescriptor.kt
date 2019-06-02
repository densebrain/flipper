/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package org.stato.plugins.litho

import android.graphics.Rect
import android.view.View
import android.view.ViewGroup
import androidx.core.view.MarginLayoutParamsCompat
import androidx.core.view.ViewCompat
import org.stato.core.ErrorReportingRunnable
import org.stato.core.StatoDynamic
import org.stato.core.StatoObject
import org.stato.plugins.inspector.HighlightedOverlay
import org.stato.plugins.inspector.Named
import org.stato.plugins.inspector.NodeDescriptor
import org.stato.plugins.inspector.Touch
import com.facebook.litho.sections.debug.DebugSection
import org.stato.core.runOrThrow
import java.util.ArrayList

class DebugSectionDescriptor : NodeDescriptor<DebugSection>() {

  override fun invalidate(debugSection: DebugSection) {
    super.invalidate(debugSection)
    connection?.run {
      runOrThrow<Unit> {
        for (i in 0 until getChildCount(debugSection)) {
          val child = getChildAt(debugSection, i)
          if (child is DebugSection) {
            invalidate(child as DebugSection)
          }
        }
      }.run()
    }

  }

  @Throws(Exception::class)
  override fun init(node: DebugSection) {
  }

  @Throws(Exception::class)
  override fun getId(node: DebugSection): String {
    return node.getGlobalKey()
  }

  @Throws(Exception::class)
  override fun getName(node: DebugSection): String {
    return node.getName()
  }

  @Throws(Exception::class)
  override fun getChildCount(node: DebugSection): Int {
    return node.sectionChildren.size
  }

  @Throws(Exception::class)
  override fun getChildAt(node: DebugSection, index: Int): Any? {
    return node.sectionChildren[index]
  }

  @Throws(Exception::class)
  override fun getData(node: DebugSection): List<Named<StatoObject>> {
    // TODO T39526148 add changeset info
    val data = mutableListOf<Named<StatoObject>>()

    val propData = getPropData(node)
    if (propData != null) {
      data.addAll(propData)
    }

    val stateData = getStateData(node)
    if (stateData != null) {
      data.add(Named("State", stateData))
    }

    return data
  }

  @Throws(Exception::class)
  private fun getPropData(node: DebugSection): List<Named<StatoObject>>? {
    val section = node.section
    return DataUtils.getPropData(section)
  }

  @Throws(Exception::class)
  private fun getStateData(node: DebugSection): StatoObject? {
    return DataUtils.getStateData(node, node.getStateContainer())
  }

  @Throws(Exception::class)
  override fun setValue(node: DebugSection, path: Array<String>, value: StatoDynamic) {
    // TODO T39526148
  }

  @Throws(Exception::class)
  override fun getAttributes(node: DebugSection): List<Named<String>> {
    // TODO T39526148
    return ArrayList()
  }

  @Throws(Exception::class)
  override fun setHighlighted(node: DebugSection, selected: Boolean, isAlignmentMode: Boolean) {
    val childCount = getChildCount(node)

    if (node.isDiffSectionSpec) {
      for (i in 0 until childCount) {
        val view = getChildAt(node, i) as View
        highlightChildView(view, selected, isAlignmentMode)
      }
    } else {
      for (i in 0 until childCount) {
        val child = getChildAt(node, i)
        val descriptor = descriptorForClass(child!!.javaClass)
        descriptor.setHighlighted(child, selected, isAlignmentMode)
      }
    }
  }

  // This is similar to the implementation in ViewDescriptor but doesn't
  // target the parent view.
  private fun highlightChildView(node: View, selected: Boolean, isAlignmentMode: Boolean) {
    if (!selected) {
      HighlightedOverlay.removeHighlight(node)
      return
    }

    val padding = Rect(
      ViewCompat.getPaddingStart(node),
      node.getPaddingTop(),
      ViewCompat.getPaddingEnd(node),
      node.getPaddingBottom())

    val margin: Rect
    val params = node.getLayoutParams()
    if (params is ViewGroup.MarginLayoutParams) {
      val marginParams = params as ViewGroup.MarginLayoutParams
      margin = Rect(
        MarginLayoutParamsCompat.getMarginStart(marginParams),
        marginParams.topMargin,
        MarginLayoutParamsCompat.getMarginEnd(marginParams),
        marginParams.bottomMargin)
    } else {
      margin = Rect()
    }

    val left = node.getLeft()
    val top = node.getTop()

    val contentBounds = Rect(left, top, left + node.getWidth(), top + node.getHeight())

    contentBounds.offset(-left, -top)

    HighlightedOverlay.setHighlighted(node, margin, padding, contentBounds, false)
  }

  @Throws(Exception::class)
  override fun hitTest(node: DebugSection, touch: Touch) {
    val childCount = getChildCount(node)

    // For a DiffSectionSpec, check if child view to see if the touch is in its bounds.
    // For a GroupSectionSpec, check the bounds of the entire section.

    if (node.isDiffSectionSpec()) {
      for (i in 0 until childCount) {
        val child = getChildAt(node, i) as View
        val left = child.getLeft() + child.getTranslationX() as Int
        val top = child.getTop() + child.getTranslationY() as Int
        val right = child.getRight() + child.getTranslationX() as Int
        val bottom = child.getBottom() + child.getTranslationY() as Int

        val hit = touch.containedIn(left, top, right, bottom)
        if (hit) {
          touch.continueWithOffset(i, left, top)
          return
        }
      }
      touch.finish()
    } else {
      for (i in 0 until childCount) {
        val child = getChildAt(node, i) as DebugSection
        val bounds = child.getBounds()
        val hit = touch.containedIn(bounds.left, bounds.top, bounds.right, bounds.bottom)
        if (hit) {
          touch.continueWithOffset(i, 0, 0)
          return
        }
      }
      touch.finish()
    }
  }

  @Throws(Exception::class)
  override fun getDecoration(node: DebugSection): String {
    // TODO T39526148
    return ""
  }

  @Throws(Exception::class)
  override fun matches(query: String, node: DebugSection): Boolean {
    val descriptor = descriptorForClass(Any::class.java)
    return descriptor.matches(query, node)
  }

  override fun getAXChildCount(node: DebugSection): Int {
    return 0
  }
}
