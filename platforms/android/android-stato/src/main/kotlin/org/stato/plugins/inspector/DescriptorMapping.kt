/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package org.stato.plugins.inspector

import android.app.Activity
import android.app.Dialog
import android.graphics.drawable.Drawable
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.widget.TextView
import org.stato.core.StatoPluginConnection
import org.stato.plugins.inspector.descriptors.ActivityDescriptor
import org.stato.plugins.inspector.descriptors.ApplicationDescriptor
import org.stato.plugins.inspector.descriptors.DialogDescriptor
import org.stato.plugins.inspector.descriptors.DialogFragmentDescriptor
import org.stato.plugins.inspector.descriptors.DrawableDescriptor
import org.stato.plugins.inspector.descriptors.FragmentDescriptor
import org.stato.plugins.inspector.descriptors.ObjectDescriptor
import org.stato.plugins.inspector.descriptors.SupportDialogFragmentDescriptor
import org.stato.plugins.inspector.descriptors.SupportFragmentDescriptor
import org.stato.plugins.inspector.descriptors.TextViewDescriptor
import org.stato.plugins.inspector.descriptors.ViewDescriptor
import org.stato.plugins.inspector.descriptors.ViewGroupDescriptor
import org.stato.plugins.inspector.descriptors.WindowDescriptor
import androidx.fragment.app.DialogFragment as DialogFragmentX

/**
 * A mapping from classes to the object use to describe instances of a class. When looking for a
 * descriptor to describe an object this classs will traverse the object's class hierarchy until it
 * finds a matching descriptor instance.
 */

typealias  DescriptorMap<T> = MutableMap<Class<T>, NodeDescriptor<T>>
class DescriptorMapping {
  private val mapping:DescriptorMap<*> = mutableMapOf()

  /** Register a descriptor for a given class.  */
  fun <T : Any> register(clazz: Class<T>, descriptor: NodeDescriptor<T>) {
    mapping[clazz] = descriptor
  }

  internal fun <T : Any> descriptorForClass(forClazz: Class<T>): NodeDescriptor<T> {
    var clazz = forClazz
    while (!mapping.containsKey(clazz)) {
      @Suppress("UNCHECKED_CAST")
      clazz = clazz.superclass as Class<T>
    }
    @Suppress("UNCHECKED_CAST")
    return mapping[clazz] as NodeDescriptor<T>
  }

  private fun <T : Any> updateDescriptors(effect: NodeDescriptor<T>.() -> Unit) {
    mapping.values.forEach {
      @Suppress("UNCHECKED_CAST")
      effect.invoke(it as NodeDescriptor<T>)
    }
  }

  internal fun onConnect(connection: StatoPluginConnection) {
    updateDescriptors<Any> {
      setConnection(connection)
      setDescriptorMapping(this@DescriptorMapping)
    }

  }

  internal fun onDisconnect() {
    updateDescriptors<Any> {
      setConnection(null)
    }
  }

  companion object {

    /**
     * @return A DescriptorMapping initialized with default descriptors for java and Android classes.
     */
    fun withDefaults(): DescriptorMapping {
      return DescriptorMapping().apply {
        register(Any::class.java, ObjectDescriptor())
        register(ApplicationWrapper::class.java, ApplicationDescriptor())
        register(Activity::class.java, ActivityDescriptor())
        register(Window::class.java, WindowDescriptor())
        register(ViewGroup::class.java, ViewGroupDescriptor())
        register(View::class.java, ViewDescriptor())
        register(TextView::class.java, TextViewDescriptor())
        register(Drawable::class.java, DrawableDescriptor())
        register(Dialog::class.java, DialogDescriptor())
        register(android.app.Fragment::class.java, FragmentDescriptor())
        register(androidx.fragment.app.Fragment::class.java, SupportFragmentDescriptor())
        register(android.app.DialogFragment::class.java, DialogFragmentDescriptor())
        register(DialogFragmentX::class.java, SupportDialogFragmentDescriptor())
      }
    }
  }
}
