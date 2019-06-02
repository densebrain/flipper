/*
 *  Copyright (c) 2004-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.plugins.litho

import android.graphics.Rect
import android.graphics.drawable.Drawable
import android.view.View
import androidx.core.util.Pair
import org.stato.core.StatoDynamic
import org.stato.core.StatoObject
import org.stato.plugins.inspector.HighlightedOverlay
import org.stato.plugins.inspector.InspectorValue
import org.stato.plugins.inspector.Named
import org.stato.plugins.inspector.NodeDescriptor
import org.stato.plugins.inspector.Touch
import org.stato.plugins.inspector.descriptors.ObjectDescriptor
import com.facebook.litho.Component
import com.facebook.litho.DebugComponent
import com.facebook.litho.DebugLayoutNode
import com.facebook.litho.StateContainer
import com.facebook.yoga.YogaAlign
import com.facebook.yoga.YogaDirection
import com.facebook.yoga.YogaEdge
import com.facebook.yoga.YogaFlexDirection
import com.facebook.yoga.YogaJustify
import com.facebook.yoga.YogaPositionType
import com.facebook.yoga.YogaValue
import org.stato.plugins.inspector.InspectorValue.Type
import java.util.ArrayList
import java.util.Arrays

class DebugComponentDescriptor : NodeDescriptor<DebugComponent>() {

  private val overrides = mutableMapOf<String, MutableList<Pair<List<String>, StatoDynamic>>>()
  private val overrider = object : DebugComponent.Overrider {
    override fun applyComponentOverrides(key: String, component: Component) {
      overrides[key]
        ?.filter { override -> override.first!!.firstOrNull() == "Props" }
        ?.forEach { override ->
          applyReflectiveOverride(component, override.first!![1], override.second!!)
        }

    }

    override fun applyStateOverrides(key: String, stateContainer: StateContainer) {
      overrides[key]
        ?.filter { override -> override.first!!.firstOrNull() == "State" }
        ?.forEach { override ->
          applyReflectiveOverride(stateContainer, override.first!![1], override.second!!)
        }

    }

    override fun applyLayoutOverrides(key: String, node: DebugLayoutNode) {
      overrides[key]
        ?.filter { override -> override.first!!.firstOrNull() == "Props" }
        ?.forEach { override ->
          val values = override.first!!
          applyLayoutOverride(
            node,
            values.subList(1,values.size)
              .toTypedArray(),
            override.second!!
          )
        }


    }
  }

  override fun init(node: DebugComponent) {
    // We rely on the LithoView being invalidated when a component hierarchy changes.
  }

  override fun getId(node: DebugComponent): String {
    return node.globalKey
  }

  @Throws(Exception::class)
  override fun getName(node: DebugComponent): String {
    val componentDescriptor = descriptorForClass(node.component.javaClass)
    return if (componentDescriptor.javaClass !== ObjectDescriptor::class.java) {
      componentDescriptor.getName(node.component)
    } else node.component.simpleName
  }

  override fun getChildCount(node: DebugComponent): Int {
    return if (node.mountedView != null || node.mountedDrawable != null) {
      1
    } else {
      node.childComponents.size
    }
  }

  override fun getChildAt(node: DebugComponent, index: Int): Any {
    val mountedView = node.mountedView
    val mountedDrawable = node.mountedDrawable

    return if (mountedView != null) {
      mountedView
    } else if (mountedDrawable != null) {
      mountedDrawable
    } else {
      node.childComponents[index]
    }
  }

  @Throws(Exception::class)
  override fun getData(node: DebugComponent): List<Named<StatoObject>> {
    val componentDescriptor = descriptorForClass(node.component.javaClass)
    if (componentDescriptor.javaClass !== ObjectDescriptor::class.java) {
      return componentDescriptor.getData(node.component)
    }

    val data = mutableListOf<Named<StatoObject>>()

    val layoutData = getLayoutData(node)
    if (layoutData != null) {
      data.add(Named("Layout", layoutData))
    }

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

  override fun setValue(node: DebugComponent, path: Array<String>, value: StatoDynamic) {

    var overrides = overrides[node.globalKey]
    if (overrides == null) {
      overrides = mutableListOf()
      this.overrides[node.globalKey] = overrides
    }
    overrides.add(Pair(path.toList(), value))

    node.setOverrider(overrider)
    node.rerender()
  }

  override fun getAttributes(node: DebugComponent): List<Named<String>> {
    val attributes = mutableListOf<Named<String>>()
    val key = node.key
    val testKey = node.testKey

    if (key != null && key.trim().isNotEmpty()) {
      attributes.add(Named("key", key))
    }

    if (testKey != null && testKey.trim().isNotEmpty()) {
      attributes.add(Named("testKey", testKey))
    }

    return attributes
  }

  override fun getExtraInfo(node: DebugComponent): StatoObject {
    val extraInfo = StatoObject.Builder()
    val descriptor = descriptorForClass(View::class.java)
    val hostView = node.componentHost
    val lithoView = node.lithoView

    if (hostView != null) {
      try {
        extraInfo.put("linkedAXNode", descriptor.getId(hostView))
      } catch (ignored: Exception) {
        // doesn't have linked node descriptor
      }

    } else if (lithoView != null) {
      try {
        extraInfo.put("linkedAXNode", descriptor.getId(lithoView))
      } catch (ignored: Exception) {
        // doesn't add linked node descriptor
      }

    }
    return extraInfo.build()
  }

  override fun setHighlighted(node: DebugComponent, selected: Boolean, isAlignmentMode: Boolean) {
    val lithoView = node.lithoView ?: return

    if (!selected) {
      HighlightedOverlay.removeHighlight(lithoView)
      return
    }

    val layout = node.layoutNode
    val hasNode = layout != null
    val margin: Rect
    margin = if (!node.isRoot) {
      Rect(
        if (hasNode) layout!!.getResultMargin(YogaEdge.START).toInt() else 0,
        if (hasNode) layout!!.getResultMargin(YogaEdge.TOP).toInt() else 0,
        if (hasNode) layout!!.getResultMargin(YogaEdge.END).toInt() else 0,
        if (hasNode) layout!!.getResultMargin(YogaEdge.BOTTOM).toInt() else 0)
    } else {
      // Margin not applied if you're at the root
      Rect()
    }

    val padding = Rect(
      if (hasNode) layout!!.getResultPadding(YogaEdge.START).toInt() else 0,
      if (hasNode) layout!!.getResultPadding(YogaEdge.TOP).toInt() else 0,
      if (hasNode) layout!!.getResultPadding(YogaEdge.END).toInt() else 0,
      if (hasNode) layout!!.getResultPadding(YogaEdge.BOTTOM).toInt() else 0)

    val contentBounds = node.boundsInLithoView
    HighlightedOverlay.setHighlighted(lithoView, margin, padding, contentBounds, isAlignmentMode)
  }

  override fun hitTest(node: DebugComponent, touch: Touch) {
    for (i in getChildCount(node) - 1 downTo 0) {
      val child = getChildAt(node, i)
      if (child is DebugComponent) {
        val componentChild = child as DebugComponent
        val bounds = componentChild.bounds

        if (touch.containedIn(bounds.left, bounds.top, bounds.right, bounds.bottom)) {
          touch.continueWithOffset(i, bounds.left, bounds.top)
          return
        }
      } else if (child is View || child is Drawable) {
        // Components can only mount one view or drawable and its bounds are the same as the
        // hosting component.
        touch.continueWithOffset(i, 0, 0)
        return
      }
    }

    touch.finish()
  }

  @Throws(Exception::class)
  override fun getDecoration(node: DebugComponent): String {
    if (node.component != null) {
      val componentDescriptor = descriptorForClass(node.component.javaClass)
      if (componentDescriptor.javaClass !== ObjectDescriptor::class.java) {
        return componentDescriptor.getDecoration(node.component)
      }
    }
    return "litho"
  }

  @Throws(Exception::class)
  override fun matches(query: String, node: DebugComponent): Boolean {
    val descriptor = descriptorForClass(Any::class.java)
    return descriptor.matches(query, node)
  }

  companion object {


    private fun getLayoutData(node: DebugComponent): StatoObject? {
      val layout = node.layoutNode ?: return null

      val data = StatoObject.Builder()
      data.put("background", DataUtils.fromDrawable(layout.background))
      data.put("foreground", DataUtils.fromDrawable(layout.foreground))

      data.put("direction", InspectorValue.mutable(Type.Enum, layout.layoutDirection.toString()))
      data.put("flex-direction", InspectorValue.mutable(Type.Enum, layout.flexDirection.toString()))
      data.put(
        "justify-content", InspectorValue.mutable(Type.Enum, layout.justifyContent.toString()))
      data.put("align-items", InspectorValue.mutable(Type.Enum, layout.alignItems.toString()))
      data.put("align-self", InspectorValue.mutable(Type.Enum, layout.alignSelf.toString()))
      data.put("align-content", InspectorValue.mutable(Type.Enum, layout.alignContent.toString()))
      data.put("position-type", InspectorValue.mutable(Type.Enum, layout.positionType.toString()))

      data.put("flex-grow", fromFloat(layout.flexGrow))
      data.put("flex-shrink", fromFloat(layout.flexShrink))
      data.put("flex-basis", fromYogaValue(layout.flexBasis))

      data.put("width", fromYogaValue(layout.width))
      data.put("min-width", fromYogaValue(layout.minWidth))
      data.put("max-width", fromYogaValue(layout.maxWidth))

      data.put("height", fromYogaValue(layout.height))
      data.put("min-height", fromYogaValue(layout.minHeight))
      data.put("max-height", fromYogaValue(layout.maxHeight))

      data.put("aspect-ratio", fromFloat(layout.aspectRatio))

      data.put(
        "margin",
        StatoObject.Builder()
          .put("left", fromYogaValue(layout.getMargin(YogaEdge.LEFT)))
          .put("top", fromYogaValue(layout.getMargin(YogaEdge.TOP)))
          .put("right", fromYogaValue(layout.getMargin(YogaEdge.RIGHT)))
          .put("bottom", fromYogaValue(layout.getMargin(YogaEdge.BOTTOM)))
          .put("start", fromYogaValue(layout.getMargin(YogaEdge.START)))
          .put("end", fromYogaValue(layout.getMargin(YogaEdge.END)))
          .put("horizontal", fromYogaValue(layout.getMargin(YogaEdge.HORIZONTAL)))
          .put("vertical", fromYogaValue(layout.getMargin(YogaEdge.VERTICAL)))
          .put("all", fromYogaValue(layout.getMargin(YogaEdge.ALL))))

      data.put(
        "padding",
        StatoObject.Builder()
          .put("left", fromYogaValue(layout.getPadding(YogaEdge.LEFT)))
          .put("top", fromYogaValue(layout.getPadding(YogaEdge.TOP)))
          .put("right", fromYogaValue(layout.getPadding(YogaEdge.RIGHT)))
          .put("bottom", fromYogaValue(layout.getPadding(YogaEdge.BOTTOM)))
          .put("start", fromYogaValue(layout.getPadding(YogaEdge.START)))
          .put("end", fromYogaValue(layout.getPadding(YogaEdge.END)))
          .put("horizontal", fromYogaValue(layout.getPadding(YogaEdge.HORIZONTAL)))
          .put("vertical", fromYogaValue(layout.getPadding(YogaEdge.VERTICAL)))
          .put("all", fromYogaValue(layout.getPadding(YogaEdge.ALL))))

      data.put(
        "border",
        StatoObject.Builder()
          .put("left", fromFloat(layout.getBorderWidth(YogaEdge.LEFT)))
          .put("top", fromFloat(layout.getBorderWidth(YogaEdge.TOP)))
          .put("right", fromFloat(layout.getBorderWidth(YogaEdge.RIGHT)))
          .put("bottom", fromFloat(layout.getBorderWidth(YogaEdge.BOTTOM)))
          .put("start", fromFloat(layout.getBorderWidth(YogaEdge.START)))
          .put("end", fromFloat(layout.getBorderWidth(YogaEdge.END)))
          .put("horizontal", fromFloat(layout.getBorderWidth(YogaEdge.HORIZONTAL)))
          .put("vertical", fromFloat(layout.getBorderWidth(YogaEdge.VERTICAL)))
          .put("all", fromFloat(layout.getBorderWidth(YogaEdge.ALL))))

      data.put(
        "position",
        StatoObject.Builder()
          .put("left", fromYogaValue(layout.getPosition(YogaEdge.LEFT)))
          .put("top", fromYogaValue(layout.getPosition(YogaEdge.TOP)))
          .put("right", fromYogaValue(layout.getPosition(YogaEdge.RIGHT)))
          .put("bottom", fromYogaValue(layout.getPosition(YogaEdge.BOTTOM)))
          .put("start", fromYogaValue(layout.getPosition(YogaEdge.START)))
          .put("end", fromYogaValue(layout.getPosition(YogaEdge.END)))
          .put("horizontal", fromYogaValue(layout.getPosition(YogaEdge.HORIZONTAL)))
          .put("vertical", fromYogaValue(layout.getPosition(YogaEdge.VERTICAL)))
          .put("all", fromYogaValue(layout.getPosition(YogaEdge.ALL))))

      return data.build()
    }


    @Throws(Exception::class)
    private fun getPropData(node: DebugComponent): List<Named<StatoObject>>? {
      if (node.canResolve()) {
        return null
      }

      val component = node.component
      return DataUtils.getPropData(component)
    }


    @Throws(Exception::class)
    private fun getStateData(node: DebugComponent): StatoObject? {
      return DataUtils.getStateData(node, node.stateContainer)
    }

    private fun applyLayoutOverride(
      node: DebugLayoutNode, path: Array<String>, value: StatoDynamic) {
      when (path[0]) {
        "background" -> node.setBackgroundColor(value.asInt())
        "foreground" -> node.setForegroundColor(value.asInt())
        "direction" -> node.layoutDirection = YogaDirection.valueOf(value.asString().toUpperCase())
        "flex-direction" -> node.flexDirection = YogaFlexDirection.valueOf(value.asString().toUpperCase())
        "justify-content" -> node.justifyContent = YogaJustify.valueOf(value.asString().toUpperCase())
        "align-items" -> node.alignItems = YogaAlign.valueOf(value.asString().toUpperCase())
        "align-self" -> node.alignSelf = YogaAlign.valueOf(value.asString().toUpperCase())
        "align-content" -> node.alignContent = YogaAlign.valueOf(value.asString().toUpperCase())
        "position-type" -> node.positionType = YogaPositionType.valueOf(value.asString().toUpperCase())
        "flex-grow" -> node.flexGrow = value.asFloat()
        "flex-shrink" -> node.flexShrink = value.asFloat()
        "flex-basis" -> node.flexBasis = YogaValue.parse(value.asString())
        "width" -> node.width = YogaValue.parse(value.asString())
        "min-width" -> node.minWidth = YogaValue.parse(value.asString())
        "max-width" -> node.maxWidth = YogaValue.parse(value.asString())
        "height" -> node.height = YogaValue.parse(value.asString())
        "min-height" -> node.minHeight = YogaValue.parse(value.asString())
        "max-height" -> node.maxHeight = YogaValue.parse(value.asString())
        "aspect-ratio" -> node.aspectRatio = value.asFloat()
        "margin" -> node.setMargin(edgeFromString(path[1]), YogaValue.parse(value.asString()))
        "padding" -> node.setPadding(edgeFromString(path[1]), YogaValue.parse(value.asString()))
        "border" -> node.setBorderWidth(edgeFromString(path[1]), value.asFloat())
        "position" -> node.setPosition(edgeFromString(path[1]), YogaValue.parse(value.asString()))
      }
    }

    private fun edgeFromString(s: String): YogaEdge {
      return YogaEdge.valueOf(s.toUpperCase())
    }

    private fun applyReflectiveOverride(o: Any, key: String, dynamic: StatoDynamic) {
      try {
        val field = o.javaClass.getDeclaredField(key)
        field.isAccessible = true

        val type = field.type

        var value: Any? = null
        if (type === Int::class.javaPrimitiveType || type === Integer::class.java) {
          value = dynamic.asInt()
        } else if (type === Long::class.javaPrimitiveType || type === Long::class.java) {
          value = dynamic.asLong()
        } else if (type === Float::class.javaPrimitiveType || type === Float::class.java) {
          value = dynamic.asFloat()
        } else if (type === Double::class.javaPrimitiveType || type === Double::class.java) {
          value = dynamic.asDouble()
        } else if (type === Boolean::class.javaPrimitiveType || type === Boolean::class.java) {
          value = dynamic.asBoolean()
        } else if (type.isAssignableFrom(String::class.java)) {
          value = dynamic.asString()
        }

        if (value != null) {
          field.set(o, value)
        }
      } catch (ignored: Exception) {
      }

    }

    private fun fromFloat(f: Float) = when (f) {
      Float.NaN -> InspectorValue.mutable(Type.Enum, "undefined")
      else -> InspectorValue.mutable(Type.Number, f)
    }

    private fun fromYogaValue(v: YogaValue) = InspectorValue.mutable(Type.Enum, v.toString())

  }

}
