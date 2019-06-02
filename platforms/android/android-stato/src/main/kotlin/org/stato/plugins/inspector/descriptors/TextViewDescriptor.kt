/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package org.stato.plugins.inspector.descriptors



import android.view.View
import android.widget.TextView
import org.stato.core.StatoDynamic
import org.stato.core.StatoObject
import org.stato.plugins.inspector.InspectorValue
import org.stato.plugins.inspector.InspectorValue.Type.Companion.Color
import org.stato.plugins.inspector.InspectorValue.Type.Companion.Number
import org.stato.plugins.inspector.InspectorValue.Type.Companion.Text
import org.stato.plugins.inspector.Named
import org.stato.plugins.inspector.NodeDescriptor
import org.stato.plugins.inspector.Touch
import java.util.ArrayList

class TextViewDescriptor : NodeDescriptor<TextView>() {



  @Throws(Exception::class)
  override fun init(node: TextView) {
    val descriptor = descriptorForClass(View::class.java)
    descriptor.init(node)
  }



  @Throws(Exception::class)
  override fun getId(node: TextView): String {
    val descriptor = descriptorForClass(View::class.java)
    return descriptor.getId(node)
  }



  @Throws(Exception::class)
  override fun getName(node: TextView): String {
    val descriptor = descriptorForClass(View::class.java)
    return descriptor.getName(node)
  }



  @Throws(Exception::class)
  override fun getAXName(node: TextView): String {
    val descriptor = descriptorForClass(View::class.java)
    return descriptor.getAXName(node)
  }

    override fun getChildCount(node: TextView): Int {
    return 0
  }

  override fun getChildAt(node: TextView, index: Int): Any? {
    return null
  }

  override fun getAXChildAt(node: TextView, index: Int): Any? {
    return null
  }



  @Throws(Exception::class)
  override fun getData(node: TextView): List<Named<StatoObject>> {
    return listOf(
      Named(
        "TextView",
        StatoObject.Builder()
          .put("text", InspectorValue.mutable(Text, node.text.toString()))
          .put(
            "textColor",
            InspectorValue.mutable(Color, node.textColors.defaultColor))
          .put("textSize", InspectorValue.mutable(Number, node.textSize))
          .build()),
      *descriptorForClass(View::class.java)
        .getData(node)
        .toTypedArray()

    )
  }



  @Throws(Exception::class)
  override fun getAXData(node: TextView): List<Named<StatoObject>> {
    return listOf(*descriptorForClass(View::class.java).getAXData(node).toTypedArray())
  }



  @Throws(Exception::class)
  override fun setValue(node: TextView, path: Array<String>, value: StatoDynamic) {
    when (path[0]) {
      "TextView" -> when (path[1]) {
        "text" -> node.text = value.asString()
        "textColor" -> node.setTextColor(value.asInt())
        "textSize" -> node.textSize = value.asFloat()
      }
      else -> {
        val descriptor = descriptorForClass(View::class.java)
        descriptor.setValue(node, path, value)
      }
    }
    invalidate(node)
  }



  @Throws(Exception::class)
  override fun getAttributes(node: TextView): List<Named<String>> {
    val descriptor = descriptorForClass(View::class.java)
    return descriptor.getAttributes(node)
  }



  @Throws(Exception::class)
  override fun getAXAttributes(node: TextView): List<Named<String>> {
    val descriptor = descriptorForClass(View::class.java)
    return descriptor.getAXAttributes(node)
  }

    override fun getExtraInfo(node: TextView): StatoObject {
    val descriptor = descriptorForClass(View::class.java)
    return descriptor.getExtraInfo(node)
  }



  @Throws(Exception::class)
  override fun setHighlighted(node: TextView, selected: Boolean, isAlignmentMode: Boolean) {
    val descriptor = descriptorForClass(View::class.java)
    descriptor.setHighlighted(node, selected, isAlignmentMode)
  }



  @Throws(Exception::class)
  override fun hitTest(node: TextView, touch: Touch) {
    val descriptor = descriptorForClass(View::class.java)
    descriptor.hitTest(node, touch)
  }



  @Throws(Exception::class)
  override fun axHitTest(node: TextView, touch: Touch) {
    val descriptor = descriptorForClass(View::class.java)
    descriptor.axHitTest(node, touch)
  }

  @Throws(Exception::class)
  override fun getDecoration(node: TextView): String {
    val descriptor = descriptorForClass(View::class.java)
    return descriptor.getDecoration(node)
  }


  @Throws(Exception::class)
  override fun getAXDecoration(node: TextView): String {
    val descriptor = descriptorForClass(View::class.java)
    return descriptor.getAXDecoration(node)
  }



  @Throws(Exception::class)
  override fun matches(query: String, node: TextView): Boolean {
    val descriptor = descriptorForClass(Any::class.java)
    return descriptor.matches(query, node)
  }
}
