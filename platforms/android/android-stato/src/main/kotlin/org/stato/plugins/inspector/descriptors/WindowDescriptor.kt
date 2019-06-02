/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package org.stato.plugins.inspector.descriptors

import android.view.View
import android.view.Window
import org.stato.core.StatoDynamic
import org.stato.core.StatoObject
import org.stato.plugins.inspector.Named
import org.stato.plugins.inspector.NodeDescriptor
import org.stato.plugins.inspector.Touch
import java.util.Collections

class WindowDescriptor : NodeDescriptor<Window>() {

  override fun init(node: Window) {
  }

  override fun getId(node: Window): String {
    return Integer.toString(System.identityHashCode(node))
  }

  override fun getName(node: Window): String {
    return node.javaClass.simpleName
  }

  override fun getChildCount(node: Window): Int {
    return 1
  }

  override fun getChildAt(node: Window, index: Int): Any? {
    return node.decorView
  }

  override fun getData(node: Window): List<Named<StatoObject>> {
    return emptyList()
  }

  override fun setValue(node: Window, path: Array<String>, value: StatoDynamic) {
  }

  override fun getAttributes(node: Window): List<Named<String>> {
    return emptyList()
  }

  @Throws(Exception::class)
  override fun setHighlighted(node: Window, selected: Boolean, isAlignmentMode: Boolean) {
    val descriptor = descriptorForClass(View::class.java)
    descriptor.setHighlighted(node.decorView, selected, isAlignmentMode)
  }

  override fun hitTest(node: Window, touch: Touch) {
    touch.continueWithOffset(0, 0, 0)
  }

  override fun getDecoration(obj: Window): String {
    return ""
  }

  @Throws(Exception::class)
  override fun matches(query: String, node: Window): Boolean {
    val descriptor = descriptorForClass(Any::class.java)
    return descriptor.matches(query, node)
  }
}
