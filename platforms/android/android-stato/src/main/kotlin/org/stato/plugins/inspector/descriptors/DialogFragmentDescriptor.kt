/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package org.stato.plugins.inspector.descriptors

import android.app.Dialog
import android.app.DialogFragment
import android.app.Fragment
import org.stato.core.StatoDynamic
import org.stato.core.StatoObject
import org.stato.plugins.inspector.Named
import org.stato.plugins.inspector.NodeDescriptor
import org.stato.plugins.inspector.Touch

class DialogFragmentDescriptor : NodeDescriptor<DialogFragment>() {

    override fun init(node: DialogFragment) {
  }

  
  @Throws(Exception::class)
  override fun getId(node: DialogFragment): String {
    val descriptor = descriptorForClass(Fragment::class.java)
    return descriptor.getId(node)
  }

  
  @Throws(Exception::class)
  override fun getName(node: DialogFragment): String {
    val descriptor = descriptorForClass(Fragment::class.java)
    return descriptor.getName(node)
  }

    override fun getChildCount(node: DialogFragment): Int {
    return if (node.dialog == null) 0 else 1
  }

    override fun getChildAt(node: DialogFragment, at: Int): Any {
    return node.dialog
  }

  
  @Throws(Exception::class)
  override fun getData(node: DialogFragment): List<Named<StatoObject>> {
    val descriptor = descriptorForClass(Fragment::class.java)
    return descriptor.getData(node)
  }

  
  @Throws(Exception::class)
  override fun setValue(node: DialogFragment, path: Array<String>, value: StatoDynamic) {
    val descriptor = descriptorForClass(Fragment::class.java)
    descriptor.setValue(node, path, value)
  }

  
  @Throws(Exception::class)
  override fun getAttributes(node: DialogFragment): List<Named<String>> {
    val descriptor = descriptorForClass(Fragment::class.java)
    return descriptor.getAttributes(node)
  }

    override fun getExtraInfo(node: DialogFragment): StatoObject {
    val descriptor = descriptorForClass(Fragment::class.java)
    return descriptor.getExtraInfo(node)
  }

  
  @Throws(Exception::class)
  override fun setHighlighted(node: DialogFragment, selected: Boolean, isAlignmentMode: Boolean) {
    val descriptor = descriptorForClass(Dialog::class.java)
    if (node.dialog != null) {
      descriptor.setHighlighted(node.dialog, selected, isAlignmentMode)
    }
  }

    override fun hitTest(node: DialogFragment, touch: Touch) {
    touch.continueWithOffset(0, 0, 0)
  }

  override fun getDecoration(obj: DialogFragment): String {
    return ""
  }

  
  @Throws(Exception::class)
  override fun matches(query: String, node: DialogFragment): Boolean {
    val descriptor = descriptorForClass(Any::class.java)
    return descriptor.matches(query, node)
  }
}
