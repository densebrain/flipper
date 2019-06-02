/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package org.stato.plugins.inspector.descriptors

import android.annotation.SuppressLint
import androidx.core.view.ViewGroupCompat.LAYOUT_MODE_CLIP_BOUNDS
import androidx.core.view.ViewGroupCompat.LAYOUT_MODE_OPTICAL_BOUNDS
import android.os.Build
import android.view.View
import android.view.ViewGroup
import org.stato.R
import org.stato.core.StatoDynamic
import org.stato.core.StatoObject
import org.stato.plugins.inspector.HiddenNode
import org.stato.plugins.inspector.InspectorValue
import org.stato.plugins.inspector.Named
import org.stato.plugins.inspector.NodeDescriptor
import org.stato.plugins.inspector.Touch
import com.facebook.stetho.common.android.FragmentCompatUtil
import org.stato.core.runOrThrow
import org.stato.plugins.inspector.InspectorValue.Type

class ViewGroupDescriptor : NodeDescriptor<ViewGroup>() {

  private inner class NodeKey {
    private var key: IntArray? = null

    fun set(node: ViewGroup): Boolean {
      val childCount = node.childCount
      val key = IntArray(childCount)

      for (i in 0 until childCount) {
        val child = node.getChildAt(i)
        key[i] = System.identityHashCode(child)
      }

      var changed = false
      if (this.key == null) {
        changed = true
      } else if (this.key!!.size != key.size) {
        changed = true
      } else {
        for (i in 0 until childCount) {
          if (this.key!![i] != key[i]) {
            changed = true
            break
          }
        }
      }

      this.key = key
      return changed
    }
  }

  @SuppressLint("NewApi")
  override fun init(node: ViewGroup) {
    val key = NodeKey()

    connection?.runOrThrow<Unit> {

        if (key.set(node)) {
          val descriptor = descriptorForClass(node.javaClass)
          descriptor.invalidate(node)
          invalidateAX(node)
        }

        val hasAttachedToWindow = Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT
        if (!hasAttachedToWindow || node.isAttachedToWindow) {
          node.postDelayed(this@runOrThrow, 1000)
        }

    }?.let { maybeInvalidate ->

      node.postDelayed(maybeInvalidate, 1000)
    }
  }

  @Throws(Exception::class)
  override fun getId(node: ViewGroup): String {
    val descriptor = descriptorForClass(View::class.java)
    return descriptor.getId(node)
  }

  @Throws(Exception::class)
  override fun getName(node: ViewGroup): String {
    val descriptor = descriptorForClass(View::class.java)
    return descriptor.getName(node)
  }

  @Throws(Exception::class)
  override fun getAXName(node: ViewGroup): String {
    val descriptor = descriptorForClass(View::class.java)
    return descriptor.getAXName(node)
  }

  override fun getChildCount(node: ViewGroup): Int {
    var childCount = 0
    var i = 0
    val count = node.childCount
    while (i < count) {
      if (node.getChildAt(i) !is HiddenNode) {
        childCount++
      }
      i++
    }
    return childCount
  }

  override fun getChildAt(node: ViewGroup, index: Int): Any? {
    var i = 0
    val count = node.childCount
    while (i < count) {
      val child = node.getChildAt(i)
      if (child is HiddenNode) {
        i++
        continue
      }

      if (i >= index) {
        val fragment = getAttachedFragmentForView(child)
        return if (fragment != null && !FragmentCompatUtil.isDialogFragment(fragment)) {
          fragment
        } else child

      }
      i++
    }
    return null
  }

  override fun getAXChildAt(node: ViewGroup, index: Int): Any? {
    var i = 0
    val count = node.childCount
    while (i < count) {
      val child = node.getChildAt(i)
      if (child is HiddenNode) {
        i++
        continue
      }

      if (i >= index) {
        return child
      }
      i++
    }
    return null
  }

  @Throws(Exception::class)
  override fun getData(node: ViewGroup): List<Named<StatoObject>> {
    val props = mutableListOf<Named<StatoObject>>()
    val descriptor = descriptorForClass(View::class.java)

    val vgProps = StatoObject.Builder()

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN_MR2) {
      vgProps
        .put(
          "layoutMode",
          InspectorValue.mutable(
            Type.Enum,
            if (node.layoutMode == LAYOUT_MODE_CLIP_BOUNDS)
              "LAYOUT_MODE_CLIP_BOUNDS"
            else
              "LAYOUT_MODE_OPTICAL_BOUNDS"))
        .put("clipChildren", InspectorValue.mutable(Type.Boolean, node.clipChildren))
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      vgProps.put("clipToPadding", InspectorValue.mutable(Type.Boolean, node.clipToPadding))
    }

    props.add(0, Named("ViewGroup", vgProps.build()))

    props.addAll(descriptor.getData(node))

    return props
  }

  @Throws(Exception::class)
  override fun getAXData(node: ViewGroup): List<Named<StatoObject>> {
    val props = mutableListOf<Named<StatoObject>>()
    val descriptor = descriptorForClass(View::class.java)
    props.addAll(descriptor.getAXData(node))
    return props
  }

  @SuppressLint("NewApi")
  @Throws(Exception::class)
  override fun setValue(node: ViewGroup, path: Array<String>, value: StatoDynamic) {
    when (path[0]) {
      "ViewGroup" -> when (path[1]) {
        "layoutMode" -> when (value.asString()) {
          "LAYOUT_MODE_CLIP_BOUNDS" -> node.layoutMode = LAYOUT_MODE_CLIP_BOUNDS
          "LAYOUT_MODE_OPTICAL_BOUNDS" -> node.layoutMode = LAYOUT_MODE_OPTICAL_BOUNDS
          else -> node.layoutMode = -1
        }
        "clipChildren" -> node.clipChildren = value.asBoolean()
        "clipToPadding" -> node.clipToPadding = value.asBoolean()
      }
      else -> {
        val descriptor = descriptorForClass(View::class.java)
        descriptor.setValue(node, path, value)
      }
    }
    invalidate(node)
  }

  @Throws(Exception::class)
  override fun getAttributes(node: ViewGroup): List<Named<String>> {
    val descriptor = descriptorForClass(View::class.java)
    return descriptor.getAttributes(node)
  }

  @Throws(Exception::class)
  override fun getAXAttributes(node: ViewGroup): List<Named<String>> {
    val descriptor = descriptorForClass(View::class.java)
    return descriptor.getAXAttributes(node)
  }

  override fun getExtraInfo(node: ViewGroup): StatoObject {
    val descriptor = descriptorForClass(View::class.java)
    return descriptor.getExtraInfo(node)
  }

  @Throws(Exception::class)
  override fun setHighlighted(node: ViewGroup, selected: Boolean, isAlignmentMode: Boolean) {
    val descriptor = descriptorForClass(View::class.java)
    descriptor.setHighlighted(node, selected, isAlignmentMode)
  }

  private fun runHitTest(node: ViewGroup, touch: Touch) {
    for (i in node.childCount - 1 downTo 0) {
      val child = node.getChildAt(i)
      if (child is HiddenNode
        || child.visibility !== View.VISIBLE
        || shouldSkip(child)) {
        continue
      }

      val scrollX = node.scrollX
      val scrollY = node.scrollY

      val left = child.left + child.translationX.toInt() - scrollX
      val top = child.top + child.translationY.toInt() - scrollY
      val right = child.right + child.translationX.toInt() - scrollX
      val bottom = child.bottom + child.translationY.toInt() - scrollY

      val hit = touch.containedIn(left, top, right, bottom)

      if (hit) {
        touch.continueWithOffset(i, left, top)
        return
      }
    }

    touch.finish()
  }

  override fun hitTest(node: ViewGroup, touch: Touch) {
    runHitTest(node, touch)
  }

  override fun axHitTest(node: ViewGroup, touch: Touch) {
    runHitTest(node, touch)
  }

  private fun shouldSkip(view: View): Boolean {
    val tag = view.getTag(R.id.stato_skip_view_traversal)
    return if (tag !is Boolean) {
      false
    } else tag

  }

  override fun getDecoration(node: ViewGroup): String {
    return ""
  }

  @Throws(Exception::class)
  override fun getAXDecoration(node: ViewGroup): String {
    val descriptor = descriptorForClass(View::class.java)
    return descriptor.getAXDecoration(node)
  }

  @Throws(Exception::class)
  override fun matches(query: String, node: ViewGroup): Boolean {
    val descriptor = descriptorForClass(Any::class.java)
    return descriptor.matches(query, node)
  }

  private fun getAttachedFragmentForView(v: View): Any? {
    try {
      val fragment = FragmentCompatUtil.findFragmentForView(v)
      var added = false
      if (fragment is android.app.Fragment) {
        added = (fragment as android.app.Fragment).isAdded
      } else if (fragment is androidx.fragment.app.Fragment) {
        added = (fragment as androidx.fragment.app.Fragment).isAdded
      }

      return if (added) fragment else null
    } catch (e: RuntimeException) {
      return null
    }

  }
}
