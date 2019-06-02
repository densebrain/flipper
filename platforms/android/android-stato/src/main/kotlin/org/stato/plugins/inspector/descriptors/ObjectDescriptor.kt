/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package org.stato.plugins.inspector.descriptors

import org.stato.core.StatoDynamic
import org.stato.core.StatoObject
import org.stato.plugins.inspector.Named
import org.stato.plugins.inspector.NodeDescriptor
import org.stato.plugins.inspector.Touch
import java.util.Collections

class ObjectDescriptor : NodeDescriptor<Any>() {

    override fun init(node: Any) {
  }

    override fun getId(node: Any): String {
    return Integer.toString(System.identityHashCode(node))
  }

    override fun getName(node: Any): String {
    return node.javaClass.name
  }

    override fun getChildCount(node: Any): Int {
    return 0
  }

  override fun getChildAt(node: Any, index: Int): Any? {
    return null
  }

    override fun getData(node: Any): List<Named<StatoObject>> {
    return emptyList()
  }

    override fun setValue(node: Any, path: Array<String>, value: StatoDynamic) {
  }

    override fun getAttributes(node: Any): List<Named<String>> {
    return emptyList()
  }

    override fun setHighlighted(node: Any, selected: Boolean, isAlignmentMode: Boolean) {
  }

    override fun hitTest(node: Any, touch: Touch) {
    touch.finish()
  }

  override fun getDecoration(obj: Any): String {
    return ""
  }



  @Throws(Exception::class)
  override fun matches(query: String, node: Any): Boolean {
    val descriptor = descriptorForClass(node.javaClass)
    val attributes = descriptor.getAttributes(node)
    for (namedString in attributes) {
      if (namedString.name == "id") {
        if (namedString.value.toLowerCase().contains(query)) {
          return true
        }
      }
    }

    return descriptor.getName(node).toLowerCase().contains(query)
  }
}
