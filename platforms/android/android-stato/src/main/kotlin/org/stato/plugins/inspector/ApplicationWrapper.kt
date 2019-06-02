/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package org.stato.plugins.inspector

import android.app.Activity
import android.app.Application
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import org.stato.plugins.inspector.descriptors.utils.AndroidRootResolver
import java.lang.ref.WeakReference
import java.util.ArrayList

class ApplicationWrapper(val application: Application) : Application.ActivityLifecycleCallbacks {
  private val androidRootsResolver = AndroidRootResolver()
  private val activities = mutableListOf<WeakReference<Activity>>()
  private val handler = Handler(Looper.getMainLooper())
  private var listener: ActivityStackChangedListener? = null

  val activityStack: List<Activity>
    get() = activities.mapNotNull { it.get() }

  val viewRoots: List<View>
    get() = androidRootsResolver.listActiveRoots().map { it.view }

  interface ActivityStackChangedListener {
    fun onActivityStackChanged(stack: List<Activity>)
  }

  init {

    this.application.registerActivityLifecycleCallbacks(this)

  }

  override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {
    activities.add(WeakReference(activity))
    notifyListener()
  }

  override fun onActivityStarted(activity: Activity) {
  }

  override fun onActivityResumed(activity: Activity) {
  }

  override fun onActivityPaused(activity: Activity) {
    if (activity.isFinishing) {
      val activityIterator = activities.iterator()

      while (activityIterator.hasNext()) {
        if (activityIterator.next().get() === activity) {
          activityIterator.remove()
        }
      }

      notifyListener()
    }
  }

  override fun onActivityStopped(activity: Activity) {
  }

  override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {
  }

  override fun onActivityDestroyed(activity: Activity) {
  }

  private fun notifyListener() {
    listener?.onActivityStackChanged(activityStack)
  }

  fun setListener(listener: ActivityStackChangedListener) {
    this.listener = listener
  }

  fun postDelayed(r: Runnable, delayMillis: Long) {
    handler.postDelayed(r, delayMillis)
  }
}
