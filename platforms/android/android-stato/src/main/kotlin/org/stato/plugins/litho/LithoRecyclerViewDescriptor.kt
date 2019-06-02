/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package org.stato.plugins.litho

import android.view.View
import android.view.ViewGroup
import org.stato.core.StatoDynamic
import org.stato.core.StatoObject
import org.stato.plugins.inspector.Named
import org.stato.plugins.inspector.NodeDescriptor
import org.stato.plugins.inspector.Touch
import com.facebook.litho.sections.debug.DebugSection
import com.facebook.litho.widget.LithoRecylerView
import org.stato.core.runOrThrow
import java.util.ArrayList

class LithoRecyclerViewDescriptor : NodeDescriptor<LithoRecylerView>() {

    override fun invalidate(node: LithoRecylerView) {
    super.invalidate(node)

      connection?.run {
        runOrThrow <Unit> {
          val child = getChildAt(node, 0)
          if (child is DebugSection) {
            val childSection = child
            val descriptor = descriptorForClass(DebugSection::class.java)
            descriptor.invalidate(childSection)
          }
        }.run()
      }

  }



  @Throws(Exception::class)
  override fun init(node: LithoRecylerView) {
    val descriptor = descriptorForClass(ViewGroup::class.java)
    @Suppress("CAST_NEVER_SUCCEEDS")
    descriptor.init(node as ViewGroup)
  }



  @Throws(Exception::class)
  override fun getId(node: LithoRecylerView): String {
    val descriptor = descriptorForClass(ViewGroup::class.java)
    @Suppress("CAST_NEVER_SUCCEEDS")
    return descriptor.getId(node as ViewGroup)
  }



  @Throws(Exception::class)
  override fun getName(node: LithoRecylerView): String {
    val descriptor = descriptorForClass(ViewGroup::class.java)
    @Suppress("CAST_NEVER_SUCCEEDS")
    return descriptor.getName(node as ViewGroup)
  }



  @Throws(Exception::class)
  override fun getChildCount(node: LithoRecylerView): Int {
    return 1
  }



  @Throws(Exception::class)
  override fun getChildAt(node: LithoRecylerView, index: Int): Any? {
    // TODO T39526148 account for the case above
    val descriptor = descriptorForClass(ViewGroup::class.java)
    @Suppress("CAST_NEVER_SUCCEEDS")
    val count = descriptor.getChildCount(node  as ViewGroup)

    val childrenViews = mutableListOf<View>()
    for (i in 0 until count) {
      childrenViews.add(descriptor.getChildAt(node, i) as View)
    }

    return DebugSection.getRootInstance(childrenViews)
  }



  @Throws(Exception::class)
  override fun getData(node: LithoRecylerView): List<Named<StatoObject>> {

    @Suppress("CAST_NEVER_SUCCEEDS")
    return descriptorForClass(ViewGroup::class.java).getData(node as ViewGroup)
  }



  @Throws(Exception::class)
  override fun setValue(node: LithoRecylerView, path: Array<String>, value: StatoDynamic) {
    val descriptor = descriptorForClass(ViewGroup::class.java)
    @Suppress("CAST_NEVER_SUCCEEDS")
    descriptor.setValue(node as ViewGroup, path, value)
  }



  @Throws(Exception::class)
  override fun getAttributes(node: LithoRecylerView): List<Named<String>> {
    val descriptor = descriptorForClass(ViewGroup::class.java)
    @Suppress("CAST_NEVER_SUCCEEDS")
    return descriptor.getAttributes(node as ViewGroup)
  }

    override fun getExtraInfo(node: LithoRecylerView): StatoObject {
    val descriptor = descriptorForClass(ViewGroup::class.java)
    return descriptor.getExtraInfo(node as ViewGroup)
  }



  @Throws(Exception::class)
  override fun hitTest(node: LithoRecylerView, touch: Touch) {
    touch.continueWithOffset(0, 0, 0)
  }



  @Throws(Exception::class)
  override fun axHitTest(node: LithoRecylerView, touch: Touch) {
    val descriptor = descriptorForClass(ViewGroup::class.java)
    @Suppress("CAST_NEVER_SUCCEEDS")
    descriptor.axHitTest(node as ViewGroup, touch)
  }



  @Throws(Exception::class)
  override fun getAXName(node: LithoRecylerView): String {
    val descriptor = descriptorForClass(ViewGroup::class.java)
    @Suppress("CAST_NEVER_SUCCEEDS")
    return descriptor.getAXName(node as ViewGroup)
  }



  @Throws(Exception::class)
  override fun getAXAttributes(node: LithoRecylerView): List<Named<String>> {
    val descriptor = descriptorForClass(ViewGroup::class.java)
    @Suppress("CAST_NEVER_SUCCEEDS")
    return descriptor.getAXAttributes(node as ViewGroup)
  }



  @Throws(Exception::class)
  override fun setHighlighted(node: LithoRecylerView, selected: Boolean, isAlignmentMode: Boolean) {
    val descriptor = descriptorForClass(ViewGroup::class.java)
    @Suppress("CAST_NEVER_SUCCEEDS")
    descriptor.setHighlighted(node as ViewGroup, selected, isAlignmentMode)
  }



  @Throws(Exception::class)
  override fun getDecoration(node: LithoRecylerView): String {
    val descriptor = descriptorForClass(ViewGroup::class.java)
    @Suppress("CAST_NEVER_SUCCEEDS")
    return descriptor.getDecoration(node as ViewGroup)
  }



  @Throws(Exception::class)
  override fun getAXDecoration(node: LithoRecylerView): String {
    val descriptor = descriptorForClass(ViewGroup::class.java)
    @Suppress("CAST_NEVER_SUCCEEDS")
    return descriptor.getAXDecoration(node as ViewGroup)
  }



  @Throws(Exception::class)
  override fun matches(query: String, node: LithoRecylerView): Boolean {
    val descriptor = descriptorForClass(Any::class.java)
    return descriptor.matches(query, node)
  }
}
