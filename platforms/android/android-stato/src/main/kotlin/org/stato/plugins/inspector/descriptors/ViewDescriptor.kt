/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
package org.stato.plugins.inspector.descriptors

import android.annotation.SuppressLint
import android.annotation.TargetApi
import android.graphics.Rect
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.Drawable
import android.os.Build
import android.util.SparseArray
import android.view.Gravity
import android.view.View
import android.view.View.OnClickListener

import android.view.ViewGroup.LayoutParams
import android.view.ViewGroup.MarginLayoutParams
import android.widget.FrameLayout
import android.widget.LinearLayout
import androidx.core.view.MarginLayoutParamsCompat
import androidx.core.view.ViewCompat
import org.stato.core.StatoDynamic
import org.stato.core.StatoObject
import org.stato.plugins.inspector.HighlightedOverlay
import org.stato.plugins.inspector.InspectorValue
import org.stato.plugins.inspector.Named
import org.stato.plugins.inspector.NodeDescriptor
import org.stato.plugins.inspector.Touch
import org.stato.plugins.inspector.descriptors.utils.AccessibilityEvaluationUtil
import org.stato.plugins.inspector.descriptors.utils.AccessibilityRoleUtil
import org.stato.plugins.inspector.descriptors.utils.AccessibilityUtil
import org.stato.plugins.inspector.descriptors.utils.EnumMapping
import org.stato.plugins.inspector.descriptors.utils.ViewAccessibilityHelper
import com.facebook.stetho.common.android.ResourcesUtil
import org.densebrain.android.logging.DroidLogger
import org.densebrain.android.logging.info
import org.stato.core.runOrThrow
import org.stato.plugins.inspector.InspectorValue.Type
import java.lang.reflect.Field
import java.util.Arrays

class ViewDescriptor : NodeDescriptor<View>(), DroidLogger {

  override fun init(node: View) {
  }

  override fun getId(node: View): String {
    return Integer.toString(System.identityHashCode(node))
  }

  override fun getName(node: View): String {
    return node.javaClass.simpleName
  }

  @Throws(Exception::class)
  override fun getAXName(node: View): String {
    val nodeInfo = ViewAccessibilityHelper.createNodeInfoFromView(node)
    if (nodeInfo != null) {

      val name = nodeInfo.className
      nodeInfo.recycle()

      if (name != null && name.isNotBlank()) {
        return name.toString()
      }
    }

    // A node may have no name if a custom role description was set, but no
    // role, or if the AccessibilityNodeInfo could not be generated. If this is
    // the case name just give this node a generic name.
    return "AccessibilityNode"
  }

  override fun getChildCount(node: View): Int {
    return 0
  }

  override fun getChildAt(node: View, at: Int): Any? {
    return null
  }

  override fun getData(node: View): List<Named<StatoObject>> {
    info("Getting props for node: ${node}")
    val viewProps = StatoObject.Builder()
      .put("height", InspectorValue.mutable(node.height))
      .put("width", InspectorValue.mutable(node.width))
      .put("alpha", InspectorValue.mutable(node.alpha))
      .put("visibility", visibilityMapping[node.visibility])
      .put("background", fromDrawable(node.background))
      .put("tag", InspectorValue.mutable(node.tag))
      .put("keyedTags", getTags(node))
      .put("layoutParams", getLayoutParams(node))
      .put(
        "state",
        StatoObject.Builder()
          .put("enabled", InspectorValue.mutable(node.isEnabled))
          .put("activated", InspectorValue.mutable(node.isActivated))
          .put("focused", node.isFocused)
          .put("selected", InspectorValue.mutable(node.isSelected)))
      .put(
        "bounds",
        StatoObject.Builder()
          .put("left", InspectorValue.mutable(node.left))
          .put("right", InspectorValue.mutable(node.right))
          .put("top", InspectorValue.mutable(node.top))
          .put("bottom", InspectorValue.mutable(node.bottom)))
      .put(
        "padding",
        StatoObject.Builder()
          .put("left", InspectorValue.mutable(node.paddingLeft))
          .put("top", InspectorValue.mutable(node.paddingTop))
          .put("right", InspectorValue.mutable(node.paddingRight))
          .put("bottom", InspectorValue.mutable(node.paddingBottom)))
      .put(
        "rotation",
        StatoObject.Builder()
          .put("x", InspectorValue.mutable(node.rotationX))
          .put("y", InspectorValue.mutable(node.rotationY))
          .put("z", InspectorValue.mutable(node.rotation)))
      .put(
        "scale",
        StatoObject.Builder()
          .put("x", InspectorValue.mutable(node.scaleX))
          .put("y", InspectorValue.mutable(node.scaleY)))
      .put(
        "pivot",
        StatoObject.Builder()
          .put("x", InspectorValue.mutable(node.pivotX))
          .put("y", InspectorValue.mutable(node.pivotY)))

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR1) {
      viewProps
        .put("layoutDirection", sLayoutDirectionMapping[node.layoutDirection])
        .put("textDirection", sTextDirectionMapping[node.textDirection])
        .put("textAlignment", sTextAlignmentMapping[node.textAlignment])
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      viewProps.put("elevation", InspectorValue.mutable(node.elevation))
    }

    val translation = StatoObject.Builder()
      .put("x", InspectorValue.mutable(node.translationX))
      .put("y", InspectorValue.mutable(node.translationY))
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      translation.put("z", InspectorValue.mutable(node.translationZ))
    }
    viewProps.put("translation", translation)

    val position = StatoObject.Builder()
      .put("x", InspectorValue.mutable(node.x))
      .put("y", InspectorValue.mutable(node.y))
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
      position.put("z", InspectorValue.mutable(node.z))
    }
    viewProps.put("position", position)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      viewProps.put("foreground", fromDrawable(node.foreground))
    }

    return Arrays.asList(Named("View", viewProps.build()))
  }

  override fun getAXData(node: View): List<Named<StatoObject>> {
    return listOf(
      Named(axNodeInfoPropsTitle, AccessibilityUtil.getAccessibilityNodeInfoData(node)!!),
      Named(axTalkbackPropsTitle, AccessibilityUtil.getTalkbackData(node)),
      Named(axViewPropsTitle, AccessibilityUtil.getViewData(node)))
  }

  @SuppressLint("NewApi")
  @TargetApi(Build.VERSION_CODES.JELLY_BEAN_MR1)
  override fun setValue(node: View, path: Array<String>, value: StatoDynamic) {
    if (path[0] == axViewPropsTitle
      || path[0] == axNodeInfoPropsTitle
      || path[0] == axTalkbackPropsTitle) {
      setAccessibilityValue(node, path, value)
      return
    }

    if (path[0] != "View") {
      return
    }

    when (path[1]) {
      "elevation" -> node.elevation = value.asFloat()
      "alpha" -> node.alpha = value.asFloat()
      "visibility" -> node.visibility = visibilityMapping[value.asString()]
      "layoutParams" -> setLayoutParams(node, Arrays.copyOfRange(path, 1, path.size), value)
      "layoutDirection" -> node.layoutDirection = sLayoutDirectionMapping[value.asString()]
      "textDirection" -> node.textDirection = sTextDirectionMapping[value.asString()]
      "textAlignment" -> node.textAlignment = sTextAlignmentMapping[value.asString()]
      "background" -> node.background = ColorDrawable(value.asInt())
      "foreground" -> node.foreground = ColorDrawable(value.asInt())
      "state" -> when (path[2]) {
        "enabled" -> node.isEnabled = value.asBoolean()
        "activated" -> node.isActivated = value.asBoolean()
        "selected" -> node.isSelected = value.asBoolean()
      }
      "bounds" -> when (path[2]) {
        "left" -> node.left = value.asInt()
        "top" -> node.top = value.asInt()
        "right" -> node.right = value.asInt()
        "bottom" -> node.bottom = value.asInt()
      }
      "padding" -> when (path[2]) {
        "left" -> node.setPadding(
          value.asInt(),
          node.paddingTop,
          node.paddingRight,
          node.paddingBottom)
        "top" -> node.setPadding(
          node.paddingLeft,
          value.asInt(),
          node.paddingRight,
          node.paddingBottom)
        "right" -> node.setPadding(
          node.paddingLeft,
          node.paddingTop,
          value.asInt(),
          node.paddingBottom)
        "bottom" -> node.setPadding(
          node.paddingLeft, node.paddingTop, node.paddingRight, value.asInt())
      }
      "rotation" -> when (path[2]) {
        "x" -> node.rotationX = value.asFloat()
        "y" -> node.rotationY = value.asFloat()
        "z" -> node.rotation = value.asFloat()
      }
      "translation" -> when (path[2]) {
        "x" -> node.translationX = value.asFloat()
        "y" -> node.translationY = value.asFloat()
        "z" -> node.translationZ = value.asFloat()
      }
      "position" -> when (path[2]) {
        "x" -> node.x = value.asFloat()
        "y" -> node.y = value.asFloat()
        "z" -> node.z = value.asFloat()
      }
      "scale" -> when (path[2]) {
        "x" -> node.scaleX = value.asFloat()
        "y" -> node.scaleY = value.asFloat()
      }
      "pivot" -> when (path[2]) {
        "x" -> node.pivotY = value.asFloat()
        "y" -> node.pivotX = value.asFloat()
      }
      "width" -> {
        val lpw = node.layoutParams
        lpw.width = value.asInt()
        node.layoutParams = lpw
      }
      "height" -> {
        val lph = node.layoutParams
        lph.height = value.asInt()
        node.layoutParams = lph
      }
    }

    invalidate(node)
  }

  private fun setAccessibilityValue(node: View, path: Array<String>, value: StatoDynamic) {
    when (path[1]) {
      "focusable" -> node.isFocusable = value.asBoolean()
      "important-for-accessibility" -> node.importantForAccessibility = AccessibilityUtil.sImportantForAccessibilityMapping[value.asString()]
      "content-description" -> node.contentDescription = value.asString()
      "long-clickable" -> node.isLongClickable = value.asBoolean()
      "clickable" -> node.isClickable = value.asBoolean()
      "selected" -> node.isSelected = value.asBoolean()
      "enabled" -> node.isEnabled = value.asBoolean()
    }
    invalidateAX(node)
  }

  @Throws(Exception::class)
  override fun getAttributes(node: View): List<Named<String>> {
    val attributes = mutableListOf<Named<String>>()

    val resourceId = getResourceId(node)
    if (resourceId != null) {
      attributes.add(Named("id", resourceId))
    }

    if (sListenerInfoField != null && sOnClickListenerField != null) {
      val listenerInfo = sListenerInfoField!!.get(node)
      if (listenerInfo != null) {
        val clickListener = sOnClickListenerField!!.get(listenerInfo) as OnClickListener?
        if (clickListener != null) {
          attributes.add(Named("onClick", clickListener.javaClass.name))
        }
      }
    }

    return attributes
  }

  @Throws(Exception::class)
  override fun getAXAttributes(node: View): List<Named<String>> {
    val attributes = mutableListOf<Named<String>>()
    val role = AccessibilityRoleUtil.getRole(node).toString()
    if (role != "NONE") {
      attributes.add(Named("role", role))
    }
    return attributes
  }

  override fun getExtraInfo(node: View): StatoObject {
    return StatoObject.Builder()
      .put("focused", AccessibilityUtil.isAXFocused(node))
      .put("hasAXNode", true)
      .build()
  }

  override fun setHighlighted(node: View, selected: Boolean, isAlignmentMode: Boolean) {
    // We need to figure out whether the given View has a parent View since margins are not
    // included within a View's bounds. So, in order to display the margin values for a particular
    // view, we need to apply an overlay on its parent rather than itself.

    val parent = node.parent
    val targetView = if (parent is View) {
      parent
    } else {
      node
    }

    if (!selected) {
      HighlightedOverlay.removeHighlight(targetView)
      return
    }

    val padding = Rect(
      ViewCompat.getPaddingStart(node),
      node.paddingTop,
      ViewCompat.getPaddingEnd(node),
      node.paddingBottom
    )

    val params = node.layoutParams
    val margin = if (params is MarginLayoutParams) {
      Rect(
        MarginLayoutParamsCompat.getMarginStart(params),
        params.topMargin,
        MarginLayoutParamsCompat.getMarginEnd(params),
        params.bottomMargin)
    } else {
      Rect()
    }

    val left = node.left
    val top = node.top
    val contentBounds = Rect(left, top, left + node.width, top + node.height)
    if (targetView === node) {
      // If the View doesn't have a parent View that we're applying the overlay to, then
      // we need to ensure that it is aligned to 0, 0, rather than its relative location to its
      // parent
      contentBounds.offset(-left, -top)
    }

    HighlightedOverlay.setHighlighted(targetView, margin, padding, contentBounds, isAlignmentMode)
  }

  override fun hitTest(node: View, touch: Touch) {
    touch.finish()
  }

  override fun axHitTest(node: View, touch: Touch) {
    touch.finish()
  }

  override fun getDecoration(node: View): String {
    return ""
  }

  override fun getAXDecoration(node: View): String {
    return if (AccessibilityEvaluationUtil.isTalkbackFocusable(node)) "accessibility" else ""
  }

  @Throws(Exception::class)
  override fun matches(query: String, node: View): Boolean {
    val resourceId = getResourceId(node)

    if (resourceId != null && resourceId.toLowerCase().contains(query)) {
      return true
    }

    val objectDescriptor = descriptorForClass(Any::class.java)
    return objectDescriptor.matches(query, node)
  }

  private fun getTags(node: View): StatoObject {
    val tags = StatoObject.Builder()
    if (keyedTagsField == null) {
      return tags.build()
    }

    connection?.runOrThrow<Unit> {
      (keyedTagsField!!.get(node) as SparseArray<*>?)?.let { keyedTags ->
        0.until(keyedTags.size()).forEach { index ->
          tags.put(
            ResourcesUtil.getIdStringQuietly(
              node.context,
              node.resources,
              keyedTags.keyAt(index)
            ),
            keyedTags.valueAt(index)
          )
        }
      }
    }?.run()

    return tags.build()
  }

  private fun setLayoutParams(node: View, path: Array<String>, value: StatoDynamic) {
    val params = node.layoutParams

    when (path[0]) {
      "width" -> params.width = toSize(value.asString())
      "height" -> params.height = toSize(value.asString())
      "weight" -> {
        val linearParams = params as LinearLayout.LayoutParams
        linearParams.weight = value.asFloat()
      }
    }

    if (params is MarginLayoutParams) {

      when (path[0]) {
        "margin" -> when (path[1]) {
          "left" -> params.leftMargin = value.asInt()
          "top" -> params.topMargin = value.asInt()
          "right" -> params.rightMargin = value.asInt()
          "bottom" -> params.bottomMargin = value.asInt()
        }
      }
    }

    if (params is FrameLayout.LayoutParams) {

      when (path[0]) {
        "gravity" -> params.gravity = sGravityMapping[value.asString()]
      }
    }

    if (params is LinearLayout.LayoutParams) {

      when (path[0]) {
        "weight" -> params.weight = value.asFloat()
        "gravity" -> params.gravity = sGravityMapping[value.asString()]
      }
    }

    node.layoutParams = params
  }

  companion object {

    private const val axViewPropsTitle = "Accessibility"
    private const val axNodeInfoPropsTitle = "AccessibilityNodeInfo"
    private const val axTalkbackPropsTitle = "Talkback"

    private var keyedTagsField: Field? = null
    private var sListenerInfoField: Field? = null
    private var sOnClickListenerField: Field? = null

    init {
      try {
        keyedTagsField = View::class.java.getDeclaredField("mKeyedTags")
        keyedTagsField!!.isAccessible = true

        sListenerInfoField = View::class.java.getDeclaredField("mListenerInfo")
        sListenerInfoField!!.isAccessible = true

        val viewInfoClassName = View::class.java.name + "\$ListenerInfo"
        sOnClickListenerField = Class.forName(viewInfoClassName).getDeclaredField("mOnClickListener")
        sOnClickListenerField!!.isAccessible = true
      } catch (ignored: Exception) {
      }

    }

    @JvmStatic
    private fun getResourceId(node: View): String? {
      val id = node.id

      return if (id == View.NO_ID) {
        null
      } else ResourcesUtil.getIdStringQuietly(node.context, node.resources, id)

    }

    @JvmStatic
    private fun fromDrawable(d: Drawable?): InspectorValue<Int> {
      return when (d) {
        is ColorDrawable -> InspectorValue.mutable(Type.Color, d.color)
        else -> InspectorValue.mutable(Type.Color, 0)
      }
    }

    @JvmStatic
    private fun getLayoutParams(node: View?): StatoObject {
      node ?: return StatoObject()

      val layoutParams = node.layoutParams
      val params = StatoObject.Builder()

      params.put("width", fromSize(layoutParams.width))
      params.put("height", fromSize(layoutParams.height))

      if (layoutParams is MarginLayoutParams) {
        params.put(
          "margin",
          StatoObject.Builder()
            .put("left", InspectorValue.mutable(layoutParams.leftMargin))
            .put("top", InspectorValue.mutable(layoutParams.topMargin))
            .put("right", InspectorValue.mutable(layoutParams.rightMargin))
            .put("bottom", InspectorValue.mutable(layoutParams.bottomMargin)))
      }

      if (layoutParams is FrameLayout.LayoutParams) {
        params.put("gravity", sGravityMapping[layoutParams.gravity])
      }

      if (layoutParams is LinearLayout.LayoutParams) {
        params
          .put("weight", InspectorValue.mutable(layoutParams.weight))
          .put("gravity", sGravityMapping[layoutParams.gravity])
      }

      return params.build()
    }

    @JvmStatic
    private fun fromSize(size: Int): InspectorValue<String> {
      return when (size) {
        LayoutParams.WRAP_CONTENT -> InspectorValue.mutable(Type.Enum, "WRAP_CONTENT")
        LayoutParams.MATCH_PARENT -> InspectorValue.mutable(Type.Enum, "MATCH_PARENT")
        else -> InspectorValue.mutable(Type.Enum, Integer.toString(size))
      }
    }

    @JvmStatic
    private fun toSize(size: String): Int {
      return when (size) {
        "WRAP_CONTENT" -> LayoutParams.WRAP_CONTENT
        "MATCH_PARENT" -> LayoutParams.MATCH_PARENT
        else -> Integer.parseInt(size)
      }
    }

    @JvmStatic
    private val visibilityMapping = object : EnumMapping("VISIBLE") {
      init {
        put("VISIBLE", View.VISIBLE)
        put("INVISIBLE", View.INVISIBLE)
        put("GONE", View.GONE)
      }
    }

    @JvmStatic
    private val sLayoutDirectionMapping = object : EnumMapping("LAYOUT_DIRECTION_INHERIT") {
      init {
        put("LAYOUT_DIRECTION_INHERIT", View.LAYOUT_DIRECTION_INHERIT)
        put("LAYOUT_DIRECTION_LOCALE", View.LAYOUT_DIRECTION_LOCALE)
        put("LAYOUT_DIRECTION_LTR", View.LAYOUT_DIRECTION_LTR)
        put("LAYOUT_DIRECTION_RTL", View.LAYOUT_DIRECTION_RTL)
      }
    }

    @JvmStatic
    private val sTextDirectionMapping = object : EnumMapping("TEXT_DIRECTION_INHERIT") {
      init {
        put("TEXT_DIRECTION_INHERIT", View.TEXT_DIRECTION_INHERIT)
        put("TEXT_DIRECTION_FIRST_STRONG", View.TEXT_DIRECTION_FIRST_STRONG)
        put("TEXT_DIRECTION_ANY_RTL", View.TEXT_DIRECTION_ANY_RTL)
        put("TEXT_DIRECTION_LTR", View.TEXT_DIRECTION_LTR)
        put("TEXT_DIRECTION_RTL", View.TEXT_DIRECTION_RTL)
        put("TEXT_DIRECTION_LOCALE", View.TEXT_DIRECTION_LOCALE)
        put("TEXT_DIRECTION_FIRST_STRONG_LTR", View.TEXT_DIRECTION_FIRST_STRONG_LTR)
        put("TEXT_DIRECTION_FIRST_STRONG_RTL", View.TEXT_DIRECTION_FIRST_STRONG_RTL)
      }
    }

    @JvmStatic
    private val sTextAlignmentMapping = object : EnumMapping("TEXT_ALIGNMENT_INHERIT") {
      init {
        put("TEXT_ALIGNMENT_INHERIT", View.TEXT_ALIGNMENT_INHERIT)
        put("TEXT_ALIGNMENT_GRAVITY", View.TEXT_ALIGNMENT_GRAVITY)
        put("TEXT_ALIGNMENT_TEXT_START", View.TEXT_ALIGNMENT_TEXT_START)
        put("TEXT_ALIGNMENT_TEXT_END", View.TEXT_ALIGNMENT_TEXT_END)
        put("TEXT_ALIGNMENT_CENTER", View.TEXT_ALIGNMENT_CENTER)
        put("TEXT_ALIGNMENT_VIEW_START", View.TEXT_ALIGNMENT_VIEW_START)
        put("TEXT_ALIGNMENT_VIEW_END", View.TEXT_ALIGNMENT_VIEW_END)
      }
    }

    @JvmStatic
    private val sGravityMapping = object : EnumMapping("NO_GRAVITY") {
      init {
        put("NO_GRAVITY", Gravity.NO_GRAVITY)
        put("LEFT", Gravity.LEFT)
        put("TOP", Gravity.TOP)
        put("RIGHT", Gravity.RIGHT)
        put("BOTTOM", Gravity.BOTTOM)
        put("CENTER", Gravity.CENTER)
        put("CENTER_VERTICAL", Gravity.CENTER_VERTICAL)
        put("FILL_VERTICAL", Gravity.FILL_VERTICAL)
        put("CENTER_HORIZONTAL", Gravity.CENTER_HORIZONTAL)
        put("FILL_HORIZONTAL", Gravity.FILL_HORIZONTAL)
      }
    }
  }
}
