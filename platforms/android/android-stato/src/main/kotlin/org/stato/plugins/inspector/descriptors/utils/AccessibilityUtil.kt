/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
package org.stato.plugins.inspector.descriptors.utils

import android.content.Context.ACCESSIBILITY_SERVICE

import android.content.Context
import android.graphics.Rect
import android.os.Build
import android.text.TextUtils
import android.view.View
import android.view.ViewGroup
import android.view.accessibility.AccessibilityManager
import android.widget.EditText
import androidx.core.view.ViewCompat
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat.*
import org.stato.core.StatoArray
import org.stato.core.StatoObject
import org.stato.plugins.inspector.InspectorValue
import org.stato.plugins.inspector.descriptors.utils.AccessibilityRoleUtil.AccessibilityRole.CHECKED_TEXT_VIEW

/**
 * This class provides utility methods for determining certain accessibility properties of [ ]s and [AccessibilityNodeInfoCompat]s. It is porting some of the checks from [ ], but has stripped many features which
 * are unnecessary here.
 */
object AccessibilityUtil {
  private const val delimiter = ", "
  private val delimiterLength = delimiter.length

  private val accessibilityActionMapping: EnumMapping = object : EnumMapping("UNKNOWN") {
    init {
      put("FOCUS", ACTION_FOCUS)
      put("CLEAR_FOCUS", ACTION_CLEAR_FOCUS)
      put("SELECT", ACTION_SELECT)
      put("CLEAR_SELECTION", ACTION_CLEAR_SELECTION)
      put("CLICK", ACTION_CLICK)
      put("LONG_CLICK", ACTION_LONG_CLICK)
      put("ACCESSIBILITY_FOCUS", ACTION_ACCESSIBILITY_FOCUS)
      put(
        "CLEAR_ACCESSIBILITY_FOCUS",
        ACTION_CLEAR_ACCESSIBILITY_FOCUS)
      put(
        "NEXT_AT_MOVEMENT_GRANULARITY",
        ACTION_NEXT_AT_MOVEMENT_GRANULARITY)
      put(
        "PREVIOUS_AT_MOVEMENT_GRANULARITY",
        ACTION_PREVIOUS_AT_MOVEMENT_GRANULARITY)
      put("NEXT_HTML_ELEMENT", ACTION_NEXT_HTML_ELEMENT)
      put("PREVIOUS_HTML_ELEMENT", ACTION_PREVIOUS_HTML_ELEMENT)
      put("SCROLL_FORWARD", ACTION_SCROLL_FORWARD)
      put("SCROLL_BACKWARD", ACTION_SCROLL_BACKWARD)
      put("CUT", ACTION_CUT)
      put("COPY", ACTION_COPY)
      put("PASTE", ACTION_PASTE)
      put("SET_SELECTION", ACTION_SET_SELECTION)
      put("SET_SELECTION", ACTION_SET_SELECTION)
      put("EXPAND", ACTION_EXPAND)
      put("COLLAPSE", ACTION_COLLAPSE)
      put("DISMISS", ACTION_DISMISS)
      put("SET_TEXT", ACTION_SET_TEXT)
    }
  }

  val sImportantForAccessibilityMapping: EnumMapping = object : EnumMapping("AUTO") {
    init {
      put("AUTO", View.IMPORTANT_FOR_ACCESSIBILITY_AUTO)
      put("NO", View.IMPORTANT_FOR_ACCESSIBILITY_NO)
      put("YES", View.IMPORTANT_FOR_ACCESSIBILITY_YES)
      put("NO_HIDE_DESCENDANTS", View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS)
    }
  }

  private const val SYSTEM_ACTION_MAX = 0x01FFFFFF

  /**
   * Given a [Context], determine if any accessibility service is running.
   *
   * @param context The [Context] used to get the [AccessibilityManager].
   * @return `true` if an accessibility service is currently running.
   */
  fun isAccessibilityEnabled(context: Context): Boolean {
    return (context.getSystemService(ACCESSIBILITY_SERVICE) as AccessibilityManager).isEnabled
  }

  /**
   * Given a [Context], determine if an accessibility touch exploration service (TalkBack) is
   * running.
   *
   * @param context The [Context] used to get the [AccessibilityManager].
   * @return `true` if an accessibility touch exploration service is currently running.
   */
  fun isTalkbackEnabled(context: Context): Boolean {
    return (context.getSystemService(ACCESSIBILITY_SERVICE) as AccessibilityManager)
      .isTouchExplorationEnabled
  }

  /**
   * Returns a sentence describing why a given [View] will be ignored by Google's TalkBack
   * screen reader.
   *
   * @param view The [View] to evaluate.
   * @return `String` describing why a [View] is ignored.
   */
  fun getTalkbackIgnoredReasons(view: View): String {
    val important = ViewCompat.getImportantForAccessibility(view)

    if (important == ViewCompat.IMPORTANT_FOR_ACCESSIBILITY_NO) {
      return "View has importantForAccessibility set to 'NO'."
    }

    if (important == ViewCompat.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS) {
      return "View has importantForAccessibility set to 'NO_HIDE_DESCENDANTS'."
    }

    var parent = view.parent
    while (parent is View) {
      if (ViewCompat.getImportantForAccessibility(parent as View) == ViewCompat.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS) {
        return "An ancestor View has importantForAccessibility set to 'NO_HIDE_DESCENDANTS'."
      }
      parent = parent.getParent()
    }

    val node = ViewAccessibilityHelper.createNodeInfoFromView(view)
      ?: return "AccessibilityNodeInfo cannot be found."

    try {
      if (AccessibilityEvaluationUtil.hasEqualBoundsToViewRoot(node, view)) {
        return "View has the same dimensions as the View Root."
      }

      if (!node.isVisibleToUser) {
        return "View is not visible."
      }

      if (AccessibilityEvaluationUtil.isAccessibilityFocusable(node, view)) {
        return "View is actionable, but has no description."
      }

      return if (AccessibilityEvaluationUtil.hasText(node)) {
        "View is not actionable, and an ancestor View has co-opted its description."
      } else "View is not actionable and has no description."

    } finally {
      node.recycle()
    }
  }

  /**
   * Returns a sentence describing why a given [View] will be focusable by Google's TalkBack
   * screen reader.
   *
   * @param view The [View] to evaluate.
   * @return `String` describing why a [View] is focusable.
   */
  
  fun getTalkbackFocusableReasons(view: View): String? {
    val node = ViewAccessibilityHelper.createNodeInfoFromView(view) ?: return null
    try {
      val hasText = AccessibilityEvaluationUtil.hasText(node)
      val isCheckable = node.isCheckable
      val hasNonActionableSpeakingDescendants = AccessibilityEvaluationUtil.hasNonActionableSpeakingDescendants(node, view)

      if (AccessibilityEvaluationUtil.isActionableForAccessibility(node)) {
        if (node.childCount <= 0) {
          return "View is actionable and has no children."
        } else if (hasText) {
          return "View is actionable and has a description."
        } else if (isCheckable) {
          return "View is actionable and checkable."
        } else if (hasNonActionableSpeakingDescendants) {
          return "View is actionable and has non-actionable descendants with descriptions."
        }
      }

      if (AccessibilityEvaluationUtil.isTopLevelScrollItem(node, view)) {
        if (hasText) {
          return "View is a direct child of a scrollable container and has a description."
        } else if (isCheckable) {
          return "View is a direct child of a scrollable container and is checkable."
        } else if (hasNonActionableSpeakingDescendants) {
          return "View is a direct child of a scrollable container and has non-actionable " + "descendants with descriptions."
        }
      }

      return if (hasText) {
        "View has a description and is not actionable, but has no actionable ancestor."
      } else null

    } finally {
      node.recycle()
    }
  }

  private fun supportsAction(node: AccessibilityNodeInfoCompat?, action: Int): Boolean {
    if (node != null) {
      val supportedActions = node!!.actions

      if (supportedActions and action == action) {
        return true
      }
    }

    return false
  }

  /**
   * Adds the state segments of Talkback's response to a given list. This should be kept up to date
   * as much as necessary. Details can be seen in the source code here :
   *
   *
   * https://github.com/google/talkback/compositor/src/main/res/raw/compositor.json - search for
   * "description_for_tree_status", "get_switch_state"
   *
   *
   * https://github.com/google/talkback/compositor/src/main/res/values/strings.xml
   */
  private fun addStateSegments(
    talkbackSegments: StringBuilder,
    node: AccessibilityNodeInfoCompat,
    role: AccessibilityRoleUtil.AccessibilityRole) {
    // selected status is always prepended
    if (node.isSelected) {
      talkbackSegments.append("selected$delimiter")
    }

    // next check collapse/expand/checked status
    if (supportsAction(node, ACTION_EXPAND)) {
      talkbackSegments.append("collapsed$delimiter")
    }

    if (supportsAction(node, ACTION_COLLAPSE)) {
      talkbackSegments.append("expanded$delimiter")
    }

    val roleString = role.roleString
    if (node.isCheckable
      && roleString != "Switch"
      && (role != CHECKED_TEXT_VIEW || node.isChecked)) {
      talkbackSegments.append((if (node.isChecked) "checked" else "not checked") + delimiter)
    }

    if (roleString == "Switch") {
      val switchState = node.text
      if (TextUtils.isEmpty(switchState) || role === AccessibilityRoleUtil.AccessibilityRole.TOGGLE_BUTTON) {
        talkbackSegments.append((if (node.isChecked) "checked" else "not checked") + delimiter)
      } else {
        talkbackSegments.append(switchState).append(delimiter)
      }
    }
  }

  private fun removeFinalDelimiter(builder: StringBuilder): String {
    val end = builder.length
    if (end > 0) {
      builder.delete(end - delimiterLength, end)
    }
    return builder.toString()
  }

  private fun getHintForCustomActions(node: AccessibilityNodeInfoCompat): String {
    val customActions = StringBuilder()
    for (action in node.actionList) {
      val id = action.id
      val label = action.label
      if (id > SYSTEM_ACTION_MAX) {
        // don't include custom actions that don't have a label
        if (!TextUtils.isEmpty(label)) {
          customActions.append(label).append(delimiter)
        }
      } else if (id == ACTION_DISMISS) {
        customActions.append("Dismiss$delimiter")
      } else if (id == ACTION_EXPAND) {
        customActions.append("Expand$delimiter")
      } else if (id == ACTION_COLLAPSE) {
        customActions.append("Collapse$delimiter")
      }
    }

    val actions = removeFinalDelimiter(customActions)
    return if (actions.isNotEmpty()) "Actions: $actions" else ""
  }

  // currently this is not used because the Talkback source logic seems erroneous resulting in
  // get_hint_for_actions never
  // returning any strings - see the TO DO in getTalkbackHint below once source is fixed
  private fun getHintForActions(node: AccessibilityNodeInfoCompat): String {
    val actions = StringBuilder()
    for (action in node.actionList) {
      val id = action.id
      val label = action.label
      if (id != ACTION_CLICK
        && id != ACTION_LONG_CLICK
        && !TextUtils.isEmpty(label)
        && id <= SYSTEM_ACTION_MAX) {
        actions.append(label).append(delimiter)
      }
    }

    return removeFinalDelimiter(actions)
  }

  private fun getHintForClick(node: AccessibilityNodeInfoCompat): String {
    for (action in node.actionList) {
      val id = action.id
      val label = action.label
      if (id == ACTION_CLICK && !TextUtils.isEmpty(label)) {
        return "Double tap to $label"
      }
    }

    if (node.isCheckable) {
      return "Double tap to toggle"
    }

    return if (node.isClickable) {
      "Double tap to activate"
    } else ""

  }

  private fun getHintForLongClick(node: AccessibilityNodeInfoCompat): String {
    for (action in node.actionList) {
      val id = action.id
      val label = action.label
      if (id == ACTION_LONG_CLICK && !TextUtils.isEmpty(label)) {
        return "Double tap and hold to $label"
      }
    }

    return if (node.isLongClickable) {
      "Double tap and hold to long press"
    } else ""

  }

  /**
   * Creates the text that Google's TalkBack screen reader will read aloud for a given [ ]'s hint. This hint is generally ported over from Google's TalkBack screen reader, and this
   * should be kept up to date with their implementation (as much as necessary). Hints can be turned
   * off by user, so it may not actually be spoken and this method assumes the selection style is
   * double tapping (it can also be set to keyboard or single tap but the general idea for the hint
   * is the same). Details can be seen in their source code here:
   *
   *
   * https://github.com/google/talkback/compositor/src/main/res/raw/compositor.json - search for
   * "get_hint_from_node"
   *
   *
   * https://github.com/google/talkback/compositor/src/main/res/values/strings.xml
   *
   * @param view The [View] to evaluate for a hint.
   * @return `String` representing the hint talkback will say when a [View] is focused.
   */
  fun getTalkbackHint(view: View): CharSequence {

    val node = ViewAccessibilityHelper.createNodeInfoFromView(view) ?: return ""

    val hint = StringBuilder()
    if (node.isEnabled) {
      val role = AccessibilityRoleUtil.getRole(view)

      // special cases for spinners, pagers, and seek bars
      if (role === AccessibilityRoleUtil.AccessibilityRole.DROP_DOWN_LIST) {
        return "Double tap to change"
      } else if (role === AccessibilityRoleUtil.AccessibilityRole.PAGER) {
        return if (supportsAction(node, ACTION_SCROLL_FORWARD) || supportsAction(node, ACTION_SCROLL_BACKWARD)) {
          "Swipe with two fingers to switch pages"
        } else {
          "No more pages"
        }
      } else if (role === AccessibilityRoleUtil.AccessibilityRole.SEEK_CONTROL && (supportsAction(node, ACTION_SCROLL_FORWARD) || supportsAction(node, ACTION_SCROLL_BACKWARD))) {
        return "Use volume keys to adjust"
      } else {

        // first custom actions
        var segmentToAdd = getHintForCustomActions(node)
        if (segmentToAdd.isNotEmpty()) {
          hint.append(segmentToAdd + delimiter)
        }

        // TODO: add getHintForActions(node) here if Talkback source gets fixed.
        // Currently the "get_hint_for_actions" in the compositor source never adds to Talkback
        // output
        // because of a mismatched if condition/body. If this changes, we should also add a
        // getHintForActions
        // method here. Source at
        // https://github.com/google/talkback/compositor/src/main/res/raw/compositor.json

        // then normal tap (special case for EditText)
        if (role === AccessibilityRoleUtil.AccessibilityRole.EDIT_TEXT) {
          if (!node.isFocused) {
            hint.append("Double tap to enter text$delimiter")
          }
        } else {
          segmentToAdd = getHintForClick(node)
          if (segmentToAdd.isNotEmpty()) {
            hint.append(segmentToAdd + delimiter)
          }
        }

        // then long press
        segmentToAdd = getHintForLongClick(node)
        if (segmentToAdd.isNotEmpty()) {
          hint.append(segmentToAdd + delimiter)
        }
      }
    }
    node.recycle()
    return removeFinalDelimiter(hint)
  }

  /**
   * Creates the text that Google's TalkBack screen reader will read aloud for a given [View].
   * This may be any combination of the [View]'s `text`, `contentDescription`, and
   * the `text` and `contentDescription` of any ancestor [View].
   *
   *
   * This description is generally ported over from Google's TalkBack screen reader, and this
   * should be kept up to date with their implementation (as much as necessary). Details can be seen
   * in their source code here:
   *
   *
   * https://github.com/google/talkback/compositor/src/main/res/raw/compositor.json - search for
   * "get_description_for_tree", "append_description_for_tree", "description_for_tree_nodes"
   *
   * @param view The [View] to evaluate.
   * @return `String` representing what talkback will say when a [View] is focused.
   */
  
  fun getTalkbackDescription(view: View): CharSequence? {
    val node = ViewAccessibilityHelper.createNodeInfoFromView(view) ?: return null
    try {
      val contentDescription = node.contentDescription
      val nodeText = node.text

      val hasNodeText = !TextUtils.isEmpty(nodeText)
      val isEditText = view is EditText

      val talkbackSegments = StringBuilder()
      val role = AccessibilityRoleUtil.getRole(view)
      val roleString = getRoleDescription(view)
      val disabled = AccessibilityEvaluationUtil.isActionableForAccessibility(node) && !node.isEnabled

      // EditText's prioritize their own text content over a contentDescription so skip this
      if (!TextUtils.isEmpty(contentDescription) && (!isEditText || !hasNodeText)) {

        // first prepend any status modifiers
        addStateSegments(talkbackSegments, node, role)

        // next add content description
        talkbackSegments.append(contentDescription).append(delimiter)

        // then role
        if (roleString!!.isNotEmpty()) {
          talkbackSegments.append(roleString!! + delimiter)
        }

        // lastly disabled is appended if applicable
        if (disabled) {
          talkbackSegments.append("disabled$delimiter")
        }

        return removeFinalDelimiter(talkbackSegments)
      }

      // EditText
      if (hasNodeText) {
        // skip status checks for EditText, but description, role, and disabled are included
        talkbackSegments.append(nodeText).append(delimiter)
        if (roleString!!.isNotEmpty()) {
          talkbackSegments.append(roleString + delimiter)
        }
        if (disabled) {
          talkbackSegments.append("disabled$delimiter")
        }

        return removeFinalDelimiter(talkbackSegments)
      }

      // If there are child views and no contentDescription the text of all non-focusable children,
      // comma separated, becomes the description.
      if (view is ViewGroup) {
        val concatChildDescription = StringBuilder()
        val viewGroup = view as ViewGroup

        var i = 0
        val count = viewGroup.childCount
        while (i < count) {
          val child = viewGroup.getChildAt(i)

          val childNodeInfo = obtain()
          ViewCompat.onInitializeAccessibilityNodeInfo(child, childNodeInfo)

          if (AccessibilityEvaluationUtil.isSpeakingNode(childNodeInfo, child) && !AccessibilityEvaluationUtil.isAccessibilityFocusable(childNodeInfo, child)) {
            val childNodeDescription = getTalkbackDescription(child)
            if (!TextUtils.isEmpty(childNodeDescription)) {
              concatChildDescription.append(childNodeDescription!!.toString() + delimiter)
            }
          }
          childNodeInfo.recycle()
          i++
        }

        return removeFinalDelimiter(concatChildDescription)
      }

      return null
    } finally {
      node.recycle()
    }
  }

  /**
   * Creates a [StatoObject] of useful properties of AccessibilityNodeInfo, to be shown in
   * the Stato Layout Inspector accessibility extension. All properties are immutable since they
   * are all derived from various [View] properties. This is a more complete list than
   * getAccessibilityNodeInfoProperties returns.
   *
   * @param view The [View] to derive the AccessibilityNodeInfo properties from.
   * @return [StatoObject] containing the properties.
   */

  fun getAccessibilityNodeInfoData(view: View): StatoObject? {
    val nodeInfo = ViewAccessibilityHelper.createNodeInfoFromView(view) ?: return null

    val nodeInfoProps = StatoObject.Builder()
    val bounds = Rect()

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      val actionsArrayBuilder = StatoArray.Builder()
      for (action in nodeInfo.actionList) {
        val actionLabel = action.label as String
        if (actionLabel != null) {
          actionsArrayBuilder.put(actionLabel)
        } else {
          actionsArrayBuilder.put(
            AccessibilityUtil.accessibilityActionMapping.get(action.id, false))
        }
      }
      nodeInfoProps.put("actions", actionsArrayBuilder.build())
    }

    nodeInfoProps
      .put("accessibility-focused", nodeInfo.isAccessibilityFocused)
      .put("checkable", nodeInfo.isCheckable)
      .put("checked", nodeInfo.isChecked)
      .put("class-name", nodeInfo.className)
      .put("clickable", nodeInfo.isClickable)
      .put("content-description", nodeInfo.contentDescription)
      .put("content-invalid", nodeInfo.isContentInvalid)
      .put("context-clickable", nodeInfo.isContextClickable)
      .put("dismissable", nodeInfo.isDismissable)
      .put("drawing-order", nodeInfo.drawingOrder)
      .put("editable", nodeInfo.isEditable)
      .put("enabled", nodeInfo.isEnabled)
      .put("important-for-accessibility", nodeInfo.isImportantForAccessibility)
      .put("focusable", nodeInfo.isFocusable)
      .put("focused", nodeInfo.isFocused)
      .put("long-clickable", nodeInfo.isLongClickable)
      .put("multiline", nodeInfo.isMultiLine)
      .put("password", nodeInfo.isPassword)
      .put("scrollable", nodeInfo.isScrollable)
      .put("selected", nodeInfo.isSelected)
      .put("text", nodeInfo.text)
      .put("visible-to-user", nodeInfo.isVisibleToUser)
      .put("role-description", getRoleDescription(nodeInfo))

    nodeInfo.getBoundsInParent(bounds)
    nodeInfoProps.put(
      "parent-bounds",
      StatoObject.Builder()
        .put("width", bounds.width())
        .put("height", bounds.height())
        .put("top", bounds.top)
        .put("left", bounds.left)
        .put("bottom", bounds.bottom)
        .put("right", bounds.right))

    nodeInfo.getBoundsInScreen(bounds)
    nodeInfoProps.put(
      "screen-bounds",
      StatoObject.Builder()
        .put("width", bounds.width())
        .put("height", bounds.height())
        .put("top", bounds.top)
        .put("left", bounds.left)
        .put("bottom", bounds.bottom)
        .put("right", bounds.right))

    nodeInfo.recycle()

    return nodeInfoProps.build()
  }

  fun isAXFocused(view: View): Boolean {
    val nodeInfo = ViewAccessibilityHelper.createNodeInfoFromView(view)
    if (nodeInfo == null) {
      return false
    } else {
      val focused = nodeInfo!!.isAccessibilityFocused
      nodeInfo!!.recycle()
      return focused
    }
  }

  /**
   * Modifies a [StatoObject.Builder] to add Talkback-specific Accessibiltiy properties to
   * be shown in the Stato Layout Inspector.
   *
   * @param props The [StatoObject.Builder] to add the properties to.
   * @param view The [View] to derive the properties from.
   */
  fun addTalkbackProperties(props: StatoObject.Builder, view: View) {
    if (!AccessibilityEvaluationUtil.isTalkbackFocusable(view)) {
      props
        .put("talkback-focusable", false)
        .put("talkback-ignored-reasons", getTalkbackIgnoredReasons(view))
    } else {
      props
        .put("talkback-focusable", true)
        .put("talkback-focusable-reasons", getTalkbackFocusableReasons(view))
        .put("talkback-output", getTalkbackDescription(view))
        .put("talkback-hint", getTalkbackHint(view))
    }
  }

  fun getViewData(view: View): StatoObject {
    val props = StatoObject.Builder()

    // This needs to be an empty string to be mutable. See t20470623.
    val contentDescription = if (view.contentDescription != null) view.contentDescription else ""
    props
      .put("role", AccessibilityRoleUtil.getRole(view).toString())
      .put("role-description", InspectorValue.mutable(getRoleDescription(view) ?: ""))
      .put("content-description", InspectorValue.mutable(contentDescription))
      .put("focusable", InspectorValue.mutable(view.isFocusable))
      .put("selected", InspectorValue.mutable(view.isSelected))
      .put("enabled", InspectorValue.mutable(view.isEnabled))
      .put("long-clickable", InspectorValue.mutable(view.isLongClickable))
      .put("clickable", InspectorValue.mutable(view.isClickable))
      .put("focused", view.isFocused)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      props.put("accessibility-focused", view.isAccessibilityFocused)
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
      props.put(
        "important-for-accessibility",
        AccessibilityUtil.sImportantForAccessibilityMapping.get(
          view.importantForAccessibility))
    }

    return props.build()
  }

  fun getTalkbackData(view: View): StatoObject {
    if (!AccessibilityEvaluationUtil.isTalkbackFocusable(view)) {
      val reason = getTalkbackIgnoredReasons(view)
      return StatoObject.Builder()
        .put("talkback-focusable", false)
        .put("talkback-ignored-reasons", reason ?: "")
        .build()
    } else {
      val reason = getTalkbackFocusableReasons(view)
      val description = getTalkbackDescription(view)
      val hint = getTalkbackHint(view)
      return StatoObject.Builder()
        .put("talkback-focusable", true)
        .put("talkback-focusable-reasons", reason)
        .put("talkback-output", description)
        .put("talkback-hint", hint)
        .build()
    }
  }

  fun getRoleDescription(view: View): String? {
    val nodeInfo = ViewAccessibilityHelper.createNodeInfoFromView(view) ?: return null
    var roleDescription = getRoleDescription(nodeInfo)
    nodeInfo.recycle()

    if (roleDescription == null || roleDescription === "") {
      val role = AccessibilityRoleUtil.getRole(view)
      roleDescription = role.roleString
    }

    return roleDescription
  }


  fun getRoleDescription(nodeInfo: AccessibilityNodeInfoCompat?): String? {
    if (nodeInfo == null) {
      return null
    }

    // Custom role descriptions are only supported in support library version
    // 24.1 and higher, but there is no way to get support library version
    // info at runtime.
    try {
      return nodeInfo.roleDescription.toString()
    } catch (e: NullPointerException) {
      // no-op
    }

    return null
  }
}
