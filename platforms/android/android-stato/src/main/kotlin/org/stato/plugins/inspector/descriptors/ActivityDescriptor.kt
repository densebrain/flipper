/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package org.stato.plugins.inspector.descriptors

import android.app.Activity
import android.view.Window
import org.stato.core.StatoDynamic
import org.stato.core.StatoObject
import org.stato.plugins.inspector.Named
import org.stato.plugins.inspector.NodeDescriptor
import org.stato.plugins.inspector.Touch
import com.facebook.stetho.common.android.FragmentActivityAccessor
import com.facebook.stetho.common.android.FragmentCompat
import com.facebook.stetho.common.android.FragmentCompat.getFrameworkInstance
import com.facebook.stetho.common.android.FragmentCompat.getSupportLibInstance
import com.facebook.stetho.common.android.FragmentManagerAccessor
import java.util.ArrayList
import java.util.Collections

class ActivityDescriptor : NodeDescriptor<Activity>() {

  override fun init(node: Activity) {
  }

  override fun getId(node: Activity): String {
    return Integer.toString(System.identityHashCode(node))
  }

  override fun getName(node: Activity): String {
    return node.javaClass.simpleName
  }

  override fun getChildCount(node: Activity): Int {
    return listOf(getSupportLibInstance(), getFrameworkInstance()).map {
      getDialogFragments(it, node).size
    }.sum() + (node.window?.let { 1 } ?: 0)

  }

  override fun getChildAt(node: Activity, at: Int): Any {
    var index = at
    if (node.window != null) {
      if (index == 0) {
        return node.window
      } else {
        index--
      }
    }

    val dialogs = getDialogFragments(FragmentCompat.getSupportLibInstance(), node)
    if (index < dialogs.size) {
      return dialogs[index]
    } else {
      val supportDialogs = getDialogFragments(FragmentCompat.getFrameworkInstance(), node)
      return supportDialogs[index - dialogs.size]
    }
  }

  override fun getData(node: Activity): List<Named<StatoObject>> {
    return emptyList()
  }


  @Throws(Exception::class)
  override fun setValue(node: Activity, path: Array<String>, value: StatoDynamic) {
  }

  override fun getAttributes(node: Activity): List<Named<String>> {
    return emptyList()
  }


  @Throws(Exception::class)
  override fun setHighlighted(node: Activity, selected: Boolean, isAlignmentMode: Boolean) {
    val descriptor = descriptorForClass(Window::class.java)
    descriptor.setHighlighted(node.window, selected, isAlignmentMode)
  }

  override fun hitTest(node: Activity, touch: Touch) {
    touch.continueWithOffset(0, 0, 0)
  }


  override fun getDecoration(node: Activity): String {
    return ""
  }


  @Throws(Exception::class)
  override fun matches(query: String, node: Activity): Boolean {

    return descriptorForClass(Any::class.java).matches(query, node)
  }

  private fun getDialogFragments(compat: FragmentCompat<Any,Any,Any,Activity>?, activity: Activity): List<Any> {
    if (compat == null || !compat.fragmentActivityClass.isInstance(activity)) {
      return emptyList()
    }

    val activityAccessor = compat.forFragmentActivity()
    val fragmentManager = activityAccessor.getFragmentManager(activity) ?: return emptyList()

    val fragmentManagerAccessor = compat.forFragmentManager()
    val addedFragments = fragmentManagerAccessor.getAddedFragments(fragmentManager)
      ?: return emptyList()


    return addedFragments
      .filter { compat.fragmentActivityClass.isInstance(it) }

  }
}
