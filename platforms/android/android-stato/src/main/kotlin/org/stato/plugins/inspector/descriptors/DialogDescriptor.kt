/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package org.stato.plugins.inspector.descriptors

import android.app.Dialog
import android.view.Window
import org.stato.core.StatoDynamic
import org.stato.core.StatoObject
import org.stato.plugins.inspector.Named
import org.stato.plugins.inspector.NodeDescriptor
import org.stato.plugins.inspector.Touch
import java.util.Collections

class DialogDescriptor : NodeDescriptor<Dialog>() {

    override fun init(node: Dialog) {
  }

    override fun getId(node: Dialog): String {
    return Integer.toString(System.identityHashCode(node))
  }

    override fun getName(node: Dialog): String {
    return node.javaClass.simpleName
  }

    override fun getChildCount(node: Dialog): Int {
    return if (node.window == null) 0 else 1
  }

    override fun getChildAt(node: Dialog, at: Int): Any {
    return node.window!!
  }

    override fun getData(node: Dialog): List<Named<StatoObject>> {
    return emptyList()
  }

    override fun setValue(node: Dialog, path: Array<String>, value: StatoDynamic) {
  }

    override fun getAttributes(node: Dialog): List<Named<String>> {
    return emptyList()
  }


  @Throws(Exception::class)
  override fun setHighlighted(node: Dialog, selected: Boolean, isAlignmentMode: Boolean) {
    val descriptor = descriptorForClass(Window::class.java)
    descriptor.setHighlighted(node.window!!, selected, isAlignmentMode)
  }

    override fun hitTest(node: Dialog, touch: Touch) {
    touch.continueWithOffset(0, 0, 0)
  }


  override fun getDecoration(obj: Dialog): String {
    return ""
  }


  @Throws(Exception::class)
  override fun matches(query: String, node: Dialog): Boolean {
    val descriptor = descriptorForClass(Any::class.java)
    return descriptor.matches(query, node)
  }
}
