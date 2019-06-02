/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package org.stato.plugins.inspector.descriptors

import android.app.Activity
import android.view.View
import android.view.ViewGroup
import android.view.accessibility.AccessibilityEvent
import androidx.core.view.ViewCompat
import org.stato.core.StatoDynamic
import org.stato.core.StatoObject
import org.stato.core.runOrThrow
import org.stato.plugins.inspector.ApplicationWrapper
import org.stato.plugins.inspector.Named
import org.stato.plugins.inspector.NodeDescriptor
import org.stato.plugins.inspector.Touch
import java.util.ArrayList
import java.util.Collections

open class ApplicationDescriptor : NodeDescriptor<ApplicationWrapper>() {

  private inner class NodeKey {
    private var mKey: IntArray? = null

    internal fun set(node: ApplicationWrapper): Boolean {
      val roots = node.viewRoots
      val childCount = roots.size
      val key = IntArray(childCount)

      for (i in 0 until childCount) {
        val child = roots[i]
        key[i] = System.identityHashCode(child)
      }

      var changed = false
      if (mKey == null) {
        changed = true
      } else if (mKey!!.size != key.size) {
        changed = true
      } else {
        for (i in 0 until childCount) {
          if (mKey!![i] != key[i]) {
            changed = true
            break
          }
        }
      }

      mKey = key
      return changed
    }
  }

  private fun setDelegates(node: ApplicationWrapper) {
    clearEditedDelegates()
    val connection = connection ?: return
    node.viewRoots.forEach { view ->
      // unlikely, but check to make sure accessibility functionality doesn't change
      val hasDelegateAlready = ViewCompat.hasAccessibilityDelegate(view)
      when {
        hasDelegateAlready -> {
          val params = StatoObject.Builder()
            .put("type", "usage")
            .put("eventName", "accessibility:hasDelegateAlready")
            .build()
          connection.send("track", params)
        }

        view is ViewGroup -> {
          // add delegate to root to catch accessibility events so we can update focus in Stato
          view.setAccessibilityDelegate(
            object : View.AccessibilityDelegate() {
              override fun onRequestSendAccessibilityEvent(
                host: ViewGroup, child: View, event: AccessibilityEvent): Boolean {

                // the touchOverlay will handle the event in this case
                if (searchActive) {
                  return false
                }

                // otherwise send the necessary focus event to the plugin
                val eventType = event.eventType
                if (eventType == AccessibilityEvent.TYPE_VIEW_ACCESSIBILITY_FOCUSED) {
                  connection.send(
                    "axFocusEvent", StatoObject.Builder().put("isFocus", true).build())
                } else if (eventType == AccessibilityEvent.TYPE_VIEW_ACCESSIBILITY_FOCUS_CLEARED) {
                  connection.send(
                    "axFocusEvent", StatoObject.Builder().put("isFocus", false).build())
                } else if (eventType == AccessibilityEvent.TYPE_VIEW_CLICKED) {
                  connection.send(
                    "axFocusEvent",
                    StatoObject.Builder()
                      .put("isFocus", false)
                      .put("isClick", true)
                      .build())
                }

                return super.onRequestSendAccessibilityEvent(host, child, event)

              }
            })
          editedDelegates.add(view)
        }

      }
    }
  }

  override fun init(node: ApplicationWrapper) {
    node.setListener(
      object : ApplicationWrapper.ActivityStackChangedListener {
        override fun onActivityStackChanged(stack: List<Activity>) {
          invalidate(node)
          invalidateAX(node)
          setDelegates(node)
        }
      })

    val key = NodeKey()

    connection?.runOrThrow<Unit> {
      if (key.set(node)) {
        invalidate(node)
        invalidateAX(node)
        setDelegates(node)
      }
      node.postDelayed(this@runOrThrow, 1000)

    }?.let { job -> node.postDelayed(job, 1000) }

  }

  override fun getId(node: ApplicationWrapper): String {
    return node.application.packageName
  }

  override fun getName(node: ApplicationWrapper): String {
    return node.application.packageName
  }

  override fun getAXName(node: ApplicationWrapper): String {
    return "Application"
  }

  override fun getChildCount(node: ApplicationWrapper): Int {
    return node.viewRoots.size
  }

  override fun getChildAt(node: ApplicationWrapper, at: Int): Any {
    val view = node.viewRoots[at]

    return node.activityStack.find { it.window.decorView === view }!!

  }

  override fun getAXChildAt(node: ApplicationWrapper, at: Int): Any {
    return node.viewRoots[at]
  }

  override fun getData(node: ApplicationWrapper): List<Named<StatoObject>> {
    return emptyList()
  }

  override fun setValue(node: ApplicationWrapper, path: Array<String>, value: StatoDynamic) {
  }

  override fun getAttributes(node: ApplicationWrapper): List<Named<String>> {
    return emptyList()
  }

  override fun getExtraInfo(node: ApplicationWrapper): StatoObject {
    return StatoObject.Builder().put("hasAXNode", true).build()
  }

  @Throws(Exception::class)
  override fun setHighlighted(node: ApplicationWrapper, selected: Boolean, isAlignmentMode: Boolean) {
    val childCount = getChildCount(node)
    if (childCount > 0) {
      val topChild = getChildAt(node, childCount - 1)
      val descriptor = descriptorForClass(topChild.javaClass)
      descriptor.setHighlighted(topChild, selected, isAlignmentMode)
    }
  }

  private fun runHitTest(node: ApplicationWrapper, touch: Touch, ax: Boolean) {
    val childCount = getChildCount(node)

    for (i in childCount - 1 downTo 0) {
      val child = if (ax) getAXChildAt(node, i) else getChildAt(node, i)
      if (child is Activity || child is ViewGroup) {
        touch.continueWithOffset(i, 0, 0)
        return
      }
    }

    touch.finish()
  }

  @Override
  @Throws(Exception::class)
  override fun hitTest(node: ApplicationWrapper, touch: Touch) {
    runHitTest(node, touch, false)
  }

  @Throws(Exception::class)
  override fun axHitTest(node: ApplicationWrapper, touch: Touch) {
    runHitTest(node, touch, true)
  }

  override fun getDecoration(node: ApplicationWrapper): String {
    return ""
  }

  @Throws(Exception::class)
  override fun matches(query: String, node: ApplicationWrapper): Boolean {
    val descriptor = descriptorForClass(Any::class.java)
    return descriptor.matches(query, node)
  }

  companion object {

    private val editedDelegates = mutableListOf<ViewGroup>()
    var searchActive: Boolean = false

    fun clearEditedDelegates() {
      for (viewGroup in editedDelegates) {
        viewGroup.setAccessibilityDelegate(null)
      }
      editedDelegates.clear()
    }
  }
}
