/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.plugins.inspector.descriptors.utils

import android.graphics.Rect
import android.text.TextUtils
import android.view.View
import android.view.ViewGroup
import android.view.ViewParent
import androidx.core.view.ViewCompat
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import org.stato.plugins.inspector.descriptors.utils.AccessibilityRoleUtil.AccessibilityRole

/**
 * This class provides utility methods for determining certain accessibility properties of [ ]s and [AccessibilityNodeInfoCompat]s. It is porting some of the checks from [ ], but has stripped many features which
 * are unnecessary here.
 */
object AccessibilityEvaluationUtil {

  /**
   * Returns whether the specified node has text or a content description.
   *
   * @param node The node to check.
   * @return `true` if the node has text.
   */
  fun hasText(node: AccessibilityNodeInfoCompat?): Boolean {
    return (node != null && node.collectionInfo == null
      && (node.text.isNotBlank() || node.contentDescription.isNotBlank()))
  }

  /**
   * Returns whether the supplied [View] and [AccessibilityNodeInfoCompat] would produce
   * spoken feedback if it were accessibility focused. NOTE: not all speaking nodes are focusable.
   *
   * @param view The [View] to evaluate
   * @param node The [AccessibilityNodeInfoCompat] to evaluate
   * @return `true` if it meets the criterion for producing spoken feedback
   */
  fun isSpeakingNode(
    node: AccessibilityNodeInfoCompat?, view: View?): Boolean {
    if (node == null || view == null) {
      return false
    }

    val important = ViewCompat.getImportantForAccessibility(view)
    return if (important == ViewCompat.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS || important == ViewCompat.IMPORTANT_FOR_ACCESSIBILITY_NO && node!!.childCount <= 0) {
      false
    } else node!!.isCheckable || hasText(node) || hasNonActionableSpeakingDescendants(node, view)

  }

  /**
   * Determines if the supplied [View] and [AccessibilityNodeInfoCompat] has any
   * children which are not independently accessibility focusable and also have a spoken
   * description.
   *
   *
   * NOTE: Accessibility services will include these children's descriptions in the closest
   * focusable ancestor.
   *
   * @param view The [View] to evaluate
   * @param node The [AccessibilityNodeInfoCompat] to evaluate
   * @return `true` if it has any non-actionable speaking descendants within its subtree
   */
  fun hasNonActionableSpeakingDescendants(
    node: AccessibilityNodeInfoCompat?, view: View?): Boolean {

    if (node == null || view == null || view !is ViewGroup) {
      return false
    }

    val viewGroup = view as ViewGroup?
    var i = 0
    val count = viewGroup!!.childCount
    while (i < count) {
      val childView = viewGroup!!.getChildAt(i)

      if (childView == null) {
        i++
        continue
      }

      val childNode = AccessibilityNodeInfoCompat.obtain()
      try {
        ViewCompat.onInitializeAccessibilityNodeInfo(childView, childNode)

        if (!node!!.isVisibleToUser) {
          i++
          continue
        }

        if (isAccessibilityFocusable(childNode, childView)) {
          i++
          continue
        }

        if (isSpeakingNode(childNode, childView)) {
          return true
        }
      } finally {
        if (childNode != null) {
          childNode!!.recycle()
        }
      }
      i++
    }

    return false
  }

  /**
   * Determines if the provided [View] and [AccessibilityNodeInfoCompat] meet the
   * criteria for gaining accessibility focus.
   *
   *
   * Note: this is evaluating general focusability by accessibility services, and does not mean
   * this view will be guaranteed to be focused by specific services such as Talkback. For Talkback
   * focusability, see [.isTalkbackFocusable]
   *
   * @param view The [View] to evaluate
   * @param node The [AccessibilityNodeInfoCompat] to evaluate
   * @return `true` if it is possible to gain accessibility focus
   */
  fun isAccessibilityFocusable(
    node: AccessibilityNodeInfoCompat?, view: View?): Boolean {
    if (node == null || view == null) {
      return false
    }

    // Never focus invisible nodes.
    if (!node!!.isVisibleToUser) {
      return false
    }

    // Always focus "actionable" nodes.
    return if (isActionableForAccessibility(node)) {
      true
    } else isTopLevelScrollItem(node, view) && isSpeakingNode(node, view)

    // only focus top-level list items with non-actionable speaking children.
  }

  /**
   * Determines whether the provided [View] and [AccessibilityNodeInfoCompat] is a
   * top-level item in a scrollable container.
   *
   * @param view The [View] to evaluate
   * @param node The [AccessibilityNodeInfoCompat] to evaluate
   * @return `true` if it is a top-level item in a scrollable container.
   */
  fun isTopLevelScrollItem(
    node: AccessibilityNodeInfoCompat?, view: View?): Boolean {
    if (node == null || view == null) {
      return false
    }

    val parent = ViewCompat.getParentForAccessibility(view) as View ?: return false

    if (node.isScrollable) {
      return true
    }

    val actionList = node.actionList
    if (actionList.any { action -> listOf(AccessibilityNodeInfoCompat.ACTION_SCROLL_FORWARD, AccessibilityNodeInfoCompat.ACTION_SCROLL_BACKWARD).any { actionId -> action.id == actionId } }) {
      return true
    }

    // Top-level items in a scrolling pager are actually two levels down since the first
    // level items in pagers are the pages themselves.
    return (ViewCompat.getParentForAccessibility(parent) as? View)?.let { grandParent ->
      if (AccessibilityRoleUtil.getRole(grandParent) === AccessibilityRole.PAGER) {
        true
      } else {
        null
      }
    } ?: listOf(AccessibilityRole.LIST,AccessibilityRole.GRID,AccessibilityRole.SCROLL_VIEW,AccessibilityRole.HORIZONTAL_SCROLL_VIEW)
      .contains(AccessibilityRoleUtil.getRole(parent))

  }

  /**
   * Returns whether a node is actionable. That is, the node supports one of [ ][AccessibilityNodeInfoCompat.isClickable], [AccessibilityNodeInfoCompat.isFocusable],
   * or [AccessibilityNodeInfoCompat.isLongClickable].
   *
   * @param node The [AccessibilityNodeInfoCompat] to evaluate
   * @return `true` if node is actionable.
   */
  fun isActionableForAccessibility(node: AccessibilityNodeInfoCompat?): Boolean {
    if (node == null) {
      return false
    }

    if (node!!.isClickable || node!!.isLongClickable || node!!.isFocusable) {
      return true
    }

    val actionList = node.actionList
    return listOf(AccessibilityNodeInfoCompat.ACTION_CLICK,
      AccessibilityNodeInfoCompat.ACTION_LONG_CLICK,
      AccessibilityNodeInfoCompat.ACTION_FOCUS).any { id -> actionList.any {action -> action.id == id} }
  }

  /**
   * Determines if any of the provided [View]'s and [AccessibilityNodeInfoCompat]'s
   * ancestors can receive accessibility focus
   *
   * @param view The [View] to evaluate
   * @param node The [AccessibilityNodeInfoCompat] to evaluate
   * @return `true` if an ancestor of may receive accessibility focus
   */
  fun hasFocusableAncestor(
    node: AccessibilityNodeInfoCompat?, view: View?): Boolean {
    if (node == null || view == null) {
      return false
    }

    val parentView = ViewCompat.getParentForAccessibility(view) as? View ?: return false

    val parentNode = AccessibilityNodeInfoCompat.obtain()
    try {
      ViewCompat.onInitializeAccessibilityNodeInfo(parentView as View, parentNode)
      if (parentNode == null) {
        return false
      }

      if (hasEqualBoundsToViewRoot(parentNode, parentView) && parentNode!!.childCount > 0) {
        return false
      }

      if (isAccessibilityFocusable(parentNode, parentView)) {
        return true
      }

      if (hasFocusableAncestor(parentNode, parentView)) {
        return true
      }
    } finally {
      parentNode!!.recycle()
    }
    return false
  }

  /**
   * Returns whether a one given view is a descendant of another.
   *
   * @param view The [View] to evaluate
   * @param potentialAncestor The potential ancestor [View]
   * @return `true` if view is a descendant of potentialAncestor
   */
  private fun viewIsDescendant(view: View, potentialAncestor: View): Boolean {
    var parent = view.parent
    while (parent != null) {
      if (parent === potentialAncestor) {
        return true
      }
      parent = parent.parent
    }

    return false
  }

  /**
   * Returns whether a View has the same size and position as its View Root.
   *
   * @param view The [View] to evaluate
   * @return `true` if view has equal bounds
   */
  fun hasEqualBoundsToViewRoot(node: AccessibilityNodeInfoCompat?, view: View): Boolean {
    val rootResolver = AndroidRootResolver()
    val roots = rootResolver.listActiveRoots()
    if (roots != null) {
      for (root in roots!!) {
        if (view === root.view) {
          return true
        }

        if (viewIsDescendant(view, root.view)) {
          val nodeBounds = Rect()
          node!!.getBoundsInScreen(nodeBounds)

          val viewRootBounds = Rect()
          viewRootBounds.set(
            root.param.x,
            root.param.y,
            root.param.width + root.param.x,
            root.param.height + root.param.y)

          return nodeBounds.equals(viewRootBounds)
        }
      }
    }
    return false
  }

  /**
   * Returns whether a given [View] will be focusable by Google's TalkBack screen reader.
   *
   * @param view The [View] to evaluate.
   * @return `boolean` if the view will be ignored by TalkBack.
   */
  fun isTalkbackFocusable(view: View?): Boolean {
    if (view == null) {
      return false
    }

    val important = ViewCompat.getImportantForAccessibility(view)
    if (important == ViewCompat.IMPORTANT_FOR_ACCESSIBILITY_NO || important == ViewCompat.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS) {
      return false
    }

    // Go all the way up the tree to make sure no parent has hidden its descendants
    var parent = view!!.parent
    while (parent is View) {
      if (ViewCompat.getImportantForAccessibility(parent as View) === ViewCompat.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS) {
        return false
      }
      parent = parent.getParent()
    }

    val node = ViewAccessibilityHelper.createNodeInfoFromView(view) ?: return false

    // Non-leaf nodes identical in size to their View Root should not be focusable.
    if (hasEqualBoundsToViewRoot(node, view) && node.childCount > 0) {
      return false
    }

    try {
      if (!node.isVisibleToUser) {
        return false
      }

      if (isAccessibilityFocusable(node, view)) {
        if (node.childCount <= 0) {
          // Leaves that are accessibility focusable are never ignored, even if they don't have a
          // speakable description
          return true
        } else if (isSpeakingNode(node, view)) {
          // Node is focusable and has something to speak
          return true
        }

        // Node is focusable and has nothing to speak
        return false
      }

      // if view is not accessibility focusable, it needs to have text and no focusable ancestors.
      if (!hasText(node)) {
        return false
      }

      return if (!hasFocusableAncestor(node, view)) {
        true
      } else false

    } finally {
      node.recycle()
    }
  }
}
