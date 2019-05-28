/*
 *  Copyright (c) 2004-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.stato.plugins.litho;

import android.view.View;
import android.view.ViewGroup;
import com.facebook.stato.core.StatoConnection;
import com.facebook.stato.core.StatoObject;
import com.facebook.stato.core.StatoReceiver;
import com.facebook.stato.core.StatoResponder;
import com.facebook.stato.plugins.common.MainThreadStatoReceiver;
import com.facebook.stato.plugins.inspector.ApplicationWrapper;
import com.facebook.stato.plugins.inspector.InspectorStatoPlugin;
import com.facebook.stato.plugins.inspector.ObjectTracker;
import com.facebook.litho.LithoView;
import java.util.Stack;

public final class GenerateLithoAccessibilityRenderExtensionCommand
    implements InspectorStatoPlugin.ExtensionCommand {

  @Override
  public String command() {
    return "forceLithoAXRender";
  }

  @Override
  public StatoReceiver receiver(final ObjectTracker tracker, final StatoConnection connection) {
    return new MainThreadStatoReceiver() {
      @Override
      public void onReceiveOnMainThread(
          final StatoObject params, final StatoResponder responder) throws Exception {
        final String applicationId = params.getString("applicationId");

        // check that the application is valid
        if (applicationId == null) {
          return;
        }
        final Object obj = tracker.get(applicationId);
        if (obj != null && !(obj instanceof ApplicationWrapper)) {
          return;
        }

        final ApplicationWrapper applicationWrapper = ((ApplicationWrapper) obj);
        final boolean forceLithoAXRender = params.getBoolean("forceLithoAXRender");
        final boolean prevForceLithoAXRender = Boolean.getBoolean("is_accessibility_enabled");

        // nothing has changed, so return
        if (forceLithoAXRender == prevForceLithoAXRender) {
          return;
        }

        // change property and rerender
        System.setProperty("is_accessibility_enabled", forceLithoAXRender + "");
        forceRerenderAllLithoViews(forceLithoAXRender, applicationWrapper);
      }
    };
  }

  private void forceRerenderAllLithoViews(
      boolean forceLithoAXRender, ApplicationWrapper applicationWrapper) {

    // iterate through tree and rerender all litho views
    Stack<ViewGroup> lithoViewSearchStack = new Stack<>();
    for (View root : applicationWrapper.getViewRoots()) {
      if (root instanceof ViewGroup) {
        lithoViewSearchStack.push((ViewGroup) root);
      }
    }

    while (!lithoViewSearchStack.isEmpty()) {
      ViewGroup v = lithoViewSearchStack.pop();
      if (v instanceof LithoView) {
        ((LithoView) v).rerenderForAccessibility(forceLithoAXRender);
      } else {
        for (int i = 0; i < v.getChildCount(); i++) {
          View child = v.getChildAt(i);
          if (child instanceof ViewGroup) {
            lithoViewSearchStack.push((ViewGroup) child);
          }
        }
      }
    }
  }
}
