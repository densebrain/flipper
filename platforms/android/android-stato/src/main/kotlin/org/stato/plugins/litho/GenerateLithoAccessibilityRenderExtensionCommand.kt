/*
 *  Copyright (c) 2004-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.plugins.litho

import android.view.ViewGroup
import org.stato.plugins.common.MainThreadStatoReceiver
import org.stato.plugins.inspector.ApplicationWrapper
import org.stato.plugins.inspector.InspectorStatoPlugin
import org.stato.plugins.inspector.ObjectTracker
import com.facebook.litho.LithoView
import org.stato.core.*
import java.util.Stack

class GenerateLithoAccessibilityRenderExtensionCommand : InspectorStatoPlugin.ExtensionCommand {

  override fun command(): String {
    return "forceLithoAXRender"
  }

  override fun receiver(tracker: ObjectTracker, connection: StatoPluginConnection): StatoReceiverCallback {
    return object : MainThreadStatoReceiver() {

      @Throws(Exception::class)
      override fun onReceiveOnMainThread(
        params: StatoObject, responder: StatoResponder) {
        val applicationId = params.getString("applicationId") ?: return

        // check that the application is valid
        val obj = tracker.get(applicationId)
        if (obj != null && obj !is ApplicationWrapper) {
          return
        }

        val applicationWrapper = obj as ApplicationWrapper
        val forceLithoAXRender = params.getBoolean("forceLithoAXRender")
        val prevForceLithoAXRender = java.lang.Boolean.getBoolean("is_accessibility_enabled")

        // nothing has changed, so return
        if (forceLithoAXRender == prevForceLithoAXRender) {
          return
        }

        // change property and rerender
        System.setProperty("is_accessibility_enabled", "${forceLithoAXRender}")
        forceRerenderAllLithoViews(forceLithoAXRender, applicationWrapper)
      }
    }
  }

  private fun forceRerenderAllLithoViews(
    forceLithoAXRender: Boolean, applicationWrapper: ApplicationWrapper) {

    // iterate through tree and rerender all litho views
    val lithoViewSearchStack = Stack<ViewGroup>()
    applicationWrapper.viewRoots
      .filterIsInstance(ViewGroup::class.java)
      .forEach { lithoViewSearchStack.push(it) }


    while (!lithoViewSearchStack.isEmpty()) {
      val v = lithoViewSearchStack.pop()
      if (v is LithoView) {
        v.rerenderForAccessibility(forceLithoAXRender)
      } else {
        for (i in 0 until v.childCount) {
          val child = v.getChildAt(i)
          if (child is ViewGroup) {
            lithoViewSearchStack.push(child)
          }
        }
      }
    }
  }
}
