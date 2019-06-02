/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package org.stato.plugins.inspector.descriptors

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import org.stato.core.StatoDynamic
import org.stato.core.StatoObject
import org.stato.plugins.inspector.Named
import org.stato.plugins.inspector.NodeDescriptor
import org.stato.plugins.inspector.Touch
import com.facebook.stetho.common.android.ResourcesUtil
import java.util.Arrays
import java.util.Collections

class SupportFragmentDescriptor : NodeDescriptor<Fragment>() {

    override fun init(node: Fragment) {
  }

    override fun getId(node: Fragment): String {
    return Integer.toString(System.identityHashCode(node))
  }

    override fun getName(node: Fragment): String {
    return node.javaClass.getSimpleName()
  }

    override fun getChildCount(node: Fragment): Int {
    return if (node.getView() == null) 0 else 1
  }

  override fun getChildAt(node: Fragment, index: Int): Any? {
    return node.view
  }

    override fun getData(node: Fragment): List<Named<StatoObject>> {
    val args = node.getArguments()
    if (args == null || args!!.isEmpty()) {
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
    val id = node.getId()
    return if (id == View.NO_ID || node.getHost() == null) {
      emptyList()
    } else Arrays.asList(
      Named(
        "id", ResourcesUtil.getIdStringQuietly(node.getContext(), node.getResources(), id)))

  }

    override fun getExtraInfo(node: Fragment): StatoObject {
    return StatoObject.Builder().put("nonAXWithAXChild", true).build()
  }



  @Throws(Exception::class)
  override fun setHighlighted(node: Fragment, selected: Boolean, isAlignmentMode: Boolean) {
    if (node.getView() == null) {
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
    val descriptor = descriptorForClass(Any::class.java)
    return descriptor.matches(query, node)
  }
}
