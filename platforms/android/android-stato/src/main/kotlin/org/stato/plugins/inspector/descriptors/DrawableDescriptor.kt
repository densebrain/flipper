/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package org.stato.plugins.inspector.descriptors

import android.graphics.Rect
import android.graphics.drawable.Drawable
import android.os.Build
import android.view.View
import org.stato.core.StatoDynamic
import org.stato.core.StatoObject
import org.stato.plugins.inspector.HighlightedOverlay
import org.stato.plugins.inspector.InspectorValue
import org.stato.plugins.inspector.Named
import org.stato.plugins.inspector.NodeDescriptor
import org.stato.plugins.inspector.Touch
import java.util.Arrays
import java.util.Collections

class DrawableDescriptor : NodeDescriptor<Drawable>() {

    override fun init(node: Drawable) {
  }

    override fun getId(node: Drawable): String {
    return Integer.toString(System.identityHashCode(node))
  }

    override fun getName(node: Drawable): String {
    return node.javaClass.simpleName
  }

    override fun getChildCount(node: Drawable): Int {
    return 0
  }

  override fun getChildAt(node: Drawable, index: Int): Any? {
    return null
  }

    override fun getData(node: Drawable): List<Named<StatoObject>> {
    val props = StatoObject.Builder()
    val bounds = node.bounds

    props.put("left", InspectorValue.mutable(bounds.left))
    props.put("top", InspectorValue.mutable(bounds.top))
    props.put("right", InspectorValue.mutable(bounds.right))
    props.put("bottom", InspectorValue.mutable(bounds.bottom))

    if (hasAlphaSupport()) {
      props.put("alpha", InspectorValue.mutable(node.alpha))
    }

    return Arrays.asList(Named("Drawable", props.build()))
  }

    override fun setValue(node: Drawable, path: Array<String>, value: StatoDynamic) {
    val bounds = node.bounds

    when (path[0]) {
      "Drawable" -> when (path[1]) {
        "left" -> {
          bounds.left = value.asInt()
          node.bounds = bounds
        }
        "top" -> {
          bounds.top = value.asInt()
          node.bounds = bounds
        }
        "right" -> {
          bounds.right = value.asInt()
          node.bounds = bounds
        }
        "bottom" -> {
          bounds.bottom = value.asInt()
          node.bounds = bounds
        }
        "alpha" -> node.alpha = value.asInt()
      }
    }
  }

  private fun hasAlphaSupport(): Boolean {
    return Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT
  }

    override fun getAttributes(node: Drawable): List<Named<String>> {
    return emptyList()
  }

    override fun setHighlighted(node: Drawable, selected: Boolean, isAlignmentMode: Boolean) {
    // Ensure we handle wrapping drawable
    var callbacks = node.callback
    while (callbacks is Drawable) {
      callbacks = (callbacks as Drawable).callback
    }

    if (callbacks !is View) {
      return
    }

    val callbackView = callbacks as View
    if (selected) {
      val zero = Rect()
      val bounds = node.bounds
      HighlightedOverlay.setHighlighted(callbackView, zero, zero, bounds, isAlignmentMode)
    } else {
      HighlightedOverlay.removeHighlight(callbackView)
    }
  }

    override fun hitTest(node: Drawable, touch: Touch) {
    touch.finish()
  }

  override fun getDecoration(obj: Drawable): String {
    return ""
  }


  @Throws(Exception::class)
  override fun matches(query: String, node: Drawable): Boolean {
    val descriptor = descriptorForClass(Any::class.java)
    return descriptor.matches(query, node)
  }
}
