/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package org.stato.plugins.inspector.descriptors.utils

import android.view.View
import android.view.accessibility.AccessibilityNodeInfo
import androidx.core.view.ViewCompat
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat

/**
 * Utility class that handles the addition of a "role" for accessibility to either a View or
 * AccessibilityNodeInfo.
 */
object AccessibilityRoleUtil {

  /**
   * These roles are defined by Google's TalkBack screen reader, and this list should be kept up to
   * date with their implementation. Details can be seen in their source code here:
   *
   *
   * https://github.com/google/talkback/blob/master/utils/src/main/java/Role.java
   *
   *
   * The roles spoken by Talkback (roleStrings) should also be kept up to date and are found
   * here:
   *
   *
   * https://github.com/google/talkback/blob/master/compositor/src/main/res/values/strings.xml
   *
   *
   * https://github.com/google/talkback/blob/master/compositor/src/main/res/raw/compositor.json
   */
  enum class AccessibilityRole(
    val value: String,
    val roleString: String
  ) {
    NONE("", ""),
    BUTTON("android.widget.Button", "Button"),
    CHECK_BOX("android.widget.CompoundButton", "Check box"),
    DROP_DOWN_LIST("android.widget.Spinner", "Drop down list"),
    EDIT_TEXT("android.widget.EditText", "Edit box"),
    GRID("android.widget.GridView", "Grid"),
    IMAGE("android.widget.ImageView", "Image"),
    IMAGE_BUTTON("android.widget.ImageView", "Button"),
    LIST("android.widget.AbsListView", "List"),
    PAGER("androidx.viewpager.widget.ViewPager", "Multi-page view"),
    RADIO_BUTTON("android.widget.RadioButton", "Radio button"),
    SEEK_CONTROL("android.widget.SeekBar", "Seek control"),
    SWITCH("android.widget.Switch", "Switch"),
    TAB_BAR("android.widget.TabWidget", "Tab bar"),
    TOGGLE_BUTTON("android.widget.ToggleButton", "Switch"),
    VIEW_GROUP("android.view.ViewGroup", ""),
    WEB_VIEW("android.webkit.WebView", "Webview"),
    CHECKED_TEXT_VIEW("android.widget.CheckedTextView", ""),
    PROGRESS_BAR("android.widget.ProgressBar", "Progress bar"),
    ACTION_BAR_TAB("android.app.ActionBar\$Tab", ""),
    DRAWER_LAYOUT("androidx.drawerlayout.widget.DrawerLayout", ""),
    SLIDING_DRAWER("android.widget.SlidingDrawer", ""),
    ICON_MENU("com.android.internal.view.menu.IconMenuView", ""),
    TOAST("android.widget.Toast\$TN", ""),
    DATE_PICKER_DIALOG("android.app.DatePickerDialog", ""),
    TIME_PICKER_DIALOG("android.app.TimePickerDialog", ""),
    DATE_PICKER("android.widget.DatePicker", ""),
    TIME_PICKER("android.widget.TimePicker", ""),
    NUMBER_PICKER("android.widget.NumberPicker", ""),
    SCROLL_VIEW("android.widget.ScrollView", ""),
    HORIZONTAL_SCROLL_VIEW("android.widget.HorizontalScrollView", ""),
    KEYBOARD_KEY("android.inputmethodservice.Keyboard\$Key", "");


    companion object {

      fun fromValue(value: String): AccessibilityRole {
        return values().find { role ->
          role.value == value
        } ?: NONE


      }
    }
  }

  fun getRole(view: View?): AccessibilityRole {
    if (view == null) {
      return AccessibilityRole.NONE
    }
    val nodeInfo = AccessibilityNodeInfoCompat.obtain()
    ViewCompat.onInitializeAccessibilityNodeInfo(view, nodeInfo)
    val role = getRole(nodeInfo)
    nodeInfo.recycle()
    return role
  }

  fun getRole(nodeInfo: AccessibilityNodeInfo): AccessibilityRole {
    return getRole(AccessibilityNodeInfoCompat(nodeInfo))
  }

  fun getRole(nodeInfo: AccessibilityNodeInfoCompat): AccessibilityRole {
    val role = AccessibilityRole.fromValue(nodeInfo.getClassName() as String)
    if (role.equals(AccessibilityRole.IMAGE_BUTTON) || role.equals(AccessibilityRole.IMAGE)) {
      return if (nodeInfo.isClickable()) AccessibilityRole.IMAGE_BUTTON else AccessibilityRole.IMAGE
    }

    if (role.equals(AccessibilityRole.NONE)) {
      val collection = nodeInfo.getCollectionInfo()
      if (collection != null) {
        // RecyclerView will be classified as a list or grid.
        return if (collection!!.getRowCount() > 1 && collection!!.getColumnCount() > 1) {
          AccessibilityRole.GRID
        } else {
          AccessibilityRole.LIST
        }
      }
    }

    return role
  }

  fun getTalkbackRoleString(view: View?): String {
    return if (view == null) {
      ""
    } else getRole(view).roleString
  }
}// No instances
