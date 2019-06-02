// Copyright 2004-present Facebook. All Rights Reserved.

package org.stato.plugins.litho

import android.graphics.Rect
import android.view.ViewGroup
import org.stato.core.StatoDynamic
import org.stato.core.StatoObject
import org.stato.plugins.inspector.Named
import org.stato.plugins.inspector.NodeDescriptor
import org.stato.plugins.inspector.Touch
import com.facebook.litho.DebugComponent
import com.facebook.litho.LithoView
import java.util.ArrayList

class LithoViewDescriptor : NodeDescriptor<LithoView>() {



  @Throws(Exception::class)
  override fun init(node: LithoView) {
    node.setOnDirtyMountListener { view ->
      invalidate(view)
      invalidateAX(view)
    }
  }



  @Throws(Exception::class)
  override fun getId(node: LithoView): String {
    val descriptor = descriptorForClass(ViewGroup::class.java)
    return descriptor.getId(node)
  }



  @Throws(Exception::class)
  override fun getName(node: LithoView): String {
    val descriptor = descriptorForClass(ViewGroup::class.java)
    return descriptor.getName(node)
  }



  @Throws(Exception::class)
  override fun getAXName(node: LithoView): String {
    val descriptor = descriptorForClass(ViewGroup::class.java)
    return descriptor.getAXName(node)
  }

    override fun getChildCount(node: LithoView): Int {
    return if (DebugComponent.getRootInstance(node) == null) 0 else 1
  }

    override fun getAXChildCount(node: LithoView): Int {
    return node.getChildCount()
  }

    override fun getChildAt(node: LithoView, index: Int): Any? {
    return DebugComponent.getRootInstance(node)
  }

  override fun getAXChildAt(node: LithoView, index: Int): Any {
    return node.getChildAt(index)
  }



  @Throws(Exception::class)
  override fun getData(node: LithoView): List<Named<StatoObject>> {
    val props = mutableListOf<Named<StatoObject>>()
    val descriptor = descriptorForClass(ViewGroup::class.java)
    val mountedBounds = node.previousMountBounds

    props.add(
      0,
      Named(
        "LithoView",
        StatoObject.Builder()
          .put(
            "mountbounds",
            StatoObject.Builder()
              .put("left", mountedBounds.left)
              .put("top", mountedBounds.top)
              .put("right", mountedBounds.right)
              .put("bottom", mountedBounds.bottom))
          .build()))

    props.addAll(descriptor.getData(node))

    return props
  }



  @Throws(Exception::class)
  override fun getAXData(node: LithoView): List<Named<StatoObject>> {
    val props = mutableListOf<Named<StatoObject>>()
    val descriptor = descriptorForClass(ViewGroup::class.java)
    props.addAll(descriptor.getAXData(node))
    return props
  }



  @Throws(Exception::class)
  override fun setValue(node: LithoView, path: Array<String>, value: StatoDynamic) {
    val descriptor = descriptorForClass(ViewGroup::class.java)
    descriptor.setValue(node, path, value)
  }



  @Throws(Exception::class)
  override fun getAttributes(node: LithoView): List<Named<String>> {
    val descriptor = descriptorForClass(ViewGroup::class.java)
    return descriptor.getAttributes(node)
  }



  @Throws(Exception::class)
  override fun getAXAttributes(node: LithoView): List<Named<String>> {
    val descriptor = descriptorForClass(ViewGroup::class.java)
    return descriptor.getAXAttributes(node)
  }

    override fun getExtraInfo(node: LithoView): StatoObject {
    val descriptor = descriptorForClass(ViewGroup::class.java)
    return descriptor.getExtraInfo(node)
  }



  @Throws(Exception::class)
  override fun setHighlighted(node: LithoView, selected: Boolean, isAlignmentMode: Boolean) {
    val descriptor = descriptorForClass(ViewGroup::class.java)
    descriptor.setHighlighted(node, selected, isAlignmentMode)
  }

    override fun hitTest(node: LithoView, touch: Touch) {
    touch.continueWithOffset(0, 0, 0)
  }



  @Throws(Exception::class)
  override fun axHitTest(node: LithoView, touch: Touch) {
    val descriptor = descriptorForClass(ViewGroup::class.java)
    descriptor.axHitTest(node, touch)
  }



  @Throws(Exception::class)
  override fun getDecoration(node: LithoView): String {
    val descriptor = descriptorForClass(ViewGroup::class.java)
    return descriptor.getDecoration(node)
  }



  @Throws(Exception::class)
  override fun getAXDecoration(node: LithoView): String {
    val descriptor = descriptorForClass(ViewGroup::class.java)
    return descriptor.getAXDecoration(node)
  }



  @Throws(Exception::class)
  override fun matches(query: String, node: LithoView): Boolean {
    val descriptor = descriptorForClass(Any::class.java)
    return descriptor.matches(query, node)
  }
}
