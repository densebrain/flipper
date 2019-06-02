/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package org.stato.plugins.inspector.descriptors.utils

import android.view.WindowManager.LayoutParams

import android.os.Build
import android.view.View
import java.lang.reflect.Field
import java.lang.reflect.InvocationTargetException
import java.lang.reflect.Method
import java.util.ArrayList
import java.util.Arrays

class AndroidRootResolver {

  private var initialized: Boolean = false
  private var windowManagerObj: Any? = null
  private var viewsField: Field? = null
  private var paramsField: Field? = null

  class Root(val view: View, val param: LayoutParams)

  @Suppress("UNCHECKED_CAST")
  fun listActiveRoots(): List<Root> {
    if (!initialized) {
      initialize()
    }

    if (arrayOf(windowManagerObj, viewsField, paramsField).any { it == null })
      return emptyList()

//    var views: List<View>? = null
//    var params: List<LayoutParams>? = null

    return try {
      if (Build.VERSION.SDK_INT < 19) {
        Pair(
          listOf(*(viewsField!!.get(windowManagerObj) as Array<View>)),
          listOf(*(paramsField!!.get(windowManagerObj) as Array<LayoutParams>))
        )
      } else {
        Pair(
          viewsField!!.get(windowManagerObj) as List<View>,
          paramsField!!.get(windowManagerObj) as List<LayoutParams>
        )
      }
    } catch (ex: Throwable) {
      Pair(emptyList<View>(), emptyList<LayoutParams>())
    }.let { (views, layoutParams) ->
      0.until(views.size)
        .map { index ->
          Pair(views[index], layoutParams[index])
        }
        .map { (view, layoutParams) ->
          Root(view, layoutParams)
        }
    }

  }

  private fun initialize() {
    initialized = true
    val accessClass = if (Build.VERSION.SDK_INT > 16) WINDOW_MANAGER_GLOBAL_CLAZZ else WINDOW_MANAGER_IMPL_CLAZZ
    val instanceMethod = if (Build.VERSION.SDK_INT > 16) GET_GLOBAL_INSTANCE else GET_DEFAULT_IMPL

    try {
      val clazz = Class.forName(accessClass)
      val getMethod = clazz.getMethod(instanceMethod)
      windowManagerObj = getMethod.invoke(null)
      viewsField = clazz.getDeclaredField(VIEWS_FIELD)
      viewsField!!.isAccessible = true
      paramsField = clazz.getDeclaredField(WINDOW_PARAMS_FIELD)
      paramsField!!.isAccessible = true
    } catch (ignored: InvocationTargetException) {
    } catch (ignored: IllegalAccessException) {
    } catch (ignored: RuntimeException) {
    } catch (ignored: NoSuchMethodException) {
    } catch (ignored: NoSuchFieldException) {
    } catch (ignored: ClassNotFoundException) {
    }

  }

  companion object {

    private const val WINDOW_MANAGER_IMPL_CLAZZ = "android.view.WindowManagerImpl"
    private const val WINDOW_MANAGER_GLOBAL_CLAZZ = "android.view.WindowManagerGlobal"
    private const val VIEWS_FIELD = "mViews"
    private const val WINDOW_PARAMS_FIELD = "mParams"
    private const val GET_DEFAULT_IMPL = "getDefault"
    private const val GET_GLOBAL_INSTANCE = "getInstance"
  }
}
