/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package org.stato.plugins.inspector.descriptors

import android.annotation.SuppressLint
import android.app.Fragment
import android.os.Bundle
import android.view.View
import org.stato.core.StatoDynamic
import org.stato.core.StatoObject
import org.stato.plugins.inspector.Named
import org.stato.plugins.inspector.NodeDescriptor
import org.stato.plugins.inspector.Touch
import com.facebook.stetho.common.android.ResourcesUtil
import java.util.Arrays
import java.util.Collections

class FragmentDescriptor : NodeDescriptor<Fragment>() {

    override fun init(node: Fragment) {
  }

    override fun getId(node: Fragment): String {
    return Integer.toString(System.identityHashCode(node))
  }

    override fun getName(node: Fragment): String {
    return node.javaClass.simpleName
  }

    override fun getChildCount(node: Fragment): Int {
    return if (node.view == null) 0 else 1
  }

    override fun getChildAt(node: Fragment, index: Int): Any? {
    return node.view
  }

    override fun getData(node: Fragment): List<Named<StatoObject>> {
    val args = node.arguments
    if (args == null || args.isEmpty) {
      return emptyList()
    }

    val bundle = StatoObject.Builder()

    for (key in args!!.keySet()) {
      bundle.put(key, args!!.get(key))
    }

    return Arrays.asList(Named("Arguments", bundle.build()))
  }

    override fun setValue(node: Fragment, path: Array<String>, value: StatoDynamic) {
  }

    override fun getAttributes(node: Fragment): List<Named<String>> {
    val resourceId = getResourceId(node) ?: return emptyList()

    return Arrays.asList(Named("id", resourceId))
  }

    override fun getExtraInfo(node: Fragment): StatoObject {
    return StatoObject.Builder().put("nonAXWithAXChild", true).build()
  }


  @SuppressLint("NewApi")
  private fun getResourceId(node: Fragment): String? {
    val id = node.id

    return if (id == View.NO_ID || node.host == null) {
      null
    } else ResourcesUtil.getIdStringQuietly(node.context, node.resources, id)

  }


  @Throws(Exception::class)
  override fun setHighlighted(node: Fragment, selected: Boolean, isAlignmentMode: Boolean) {
    if (node.view == null) {
      return
    }

    val descriptor = descriptorForClass(View::class.java)
    descriptor.setHighlighted(node.view!!, selected, isAlignmentMode)
  }

    override fun hitTest(node: Fragment, touch: Touch) {
    touch.continueWithOffset(0, 0, 0)
  }

  override fun getDecoration(obj: Fragment): String {
    return ""
  }


  @Throws(Exception::class)
  override fun matches(query: String, node: Fragment): Boolean {
    val resourceId = getResourceId(node)

    if (resourceId != null) {
      if (resourceId.toLowerCase().contains(query)) {
        return true
      }
    }

    val objectDescriptor = descriptorForClass(Any::class.java)
    return objectDescriptor.matches(query, node)
  }
}
