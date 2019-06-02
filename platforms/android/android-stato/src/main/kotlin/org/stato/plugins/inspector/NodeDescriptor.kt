/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package org.stato.plugins.inspector

import org.stato.core.*

/**
 * A NodeDescriptor is an object which known how to expose an Object of type T to the ew Inspector.
 * This class is the extension point for the Stato inspector plugin and is how custom classes and
 * data can be exposed to the inspector.
 */
abstract class NodeDescriptor<T> {

  protected var connection: StatoPluginConnection? = null
  private var descriptorMapping: DescriptorMapping? = null

  internal fun setConnection(connection: StatoPluginConnection?) {
    this.connection = connection
  }

  internal fun setDescriptorMapping(descriptorMapping: DescriptorMapping) {
    this.descriptorMapping = descriptorMapping
  }

  /**
   * @return The descriptor for a given class. This is useful for when a descriptor wants to
   * delegate parts of its implementation to another descriptor, say the super class of the
   * object it describes. This is highly encouraged instead of subclassing another descriptor
   * class.
   */
  protected fun <T : Any> descriptorForClass(clazz: Class<T>): NodeDescriptor<T> {
    return descriptorMapping!!.descriptorForClass(clazz)
  }

  /**
   * Invalidate a node. This tells Stato that this node is no longer valid and its properties
   * and/or children have changed. This will trigger Stato to re-query this node getting any new
   * data.
   */
  open fun invalidate(node: T) {
    connection?.runOrThrow<Unit> {

      val array = StatoArray.Builder()
        .put(StatoObject.Builder().put("id", getId(node)).build())
        .build()
      val params = StatoObject.Builder().put("nodes", array).build()
      connection!!.send("invalidate", params)
    }?.run()

  }

  /**
   * Invalidate a node in the ax tree. This tells Stato that this node is no longer valid and its
   * properties and/or children have changed. This will trigger Stato to re-query this node
   * getting any new data.
   */
  protected fun invalidateAX(node: T) {
    connection?.runOrThrow<Unit> {
      val array = StatoArray.Builder()
        .put(StatoObject.Builder().put("id", getId(node)).build())
        .build()
      val params = StatoObject.Builder().put("nodes", array).build()
      connection!!.send("invalidateAX", params)

    }?.run()

  }

  protected fun connected(): Boolean {
    return connection != null
  }

  /**
   * Initialize a node. This implementation usually consists of setting up listeners to know when to
   * call [NodeDescriptor.invalidate].
   */
  @Throws(Exception::class)
  abstract fun init(node: T)

  /**
   * A globally unique ID used to identify a node in a hierarchy. If your node does not have a
   * globally unique ID it is fine to rely on [System.identityHashCode].
   */
  @Throws(Exception::class)
  abstract fun getId(node: T): String

  /**
   * The name used to identify this node in the inspector. Does not need to be unique. A good
   * default is to use the class name of the node.
   */
  @Throws(Exception::class)
  abstract fun getName(node: T): String

  /** Gets name for AX tree.  */
  @Throws(Exception::class)
  open fun getAXName(node: T): String {
    return ""
  }

  /** @return The number of children this node exposes in the inspector.
   */
  @Throws(Exception::class)
  abstract fun getChildCount(node: T): Int

  /** Gets child at index for AX tree. Ignores non-view children.  */
  @Throws(Exception::class)
  open fun getAXChildCount(node: T): Int {
    return getChildCount(node)
  }

  /** @return The child at index.
   */
  @Throws(Exception::class)
  abstract fun getChildAt(node: T, at: Int): Any?

  /** Gets child at index for AX tree. Ignores non-view children.  */

  @Throws(Exception::class)
  open fun getAXChildAt(node: T, at: Int): Any? {
    return getChildAt(node, at)
  }

  /**
   * Get the data to show for this node in the sidebar of the inspector. The object will be showen
   * in order and with a header matching the given name.
   */
  @Throws(Exception::class)
  abstract fun getData(node: T): List<Named<StatoObject>>

  /** Gets data for AX tree  */
  @Throws(Exception::class)
  open fun getAXData(node: T): List<Named<StatoObject>> {
    return emptyList()
  }

  /**
   * Set a value on the provided node at the given path. The path will match a key path in the data
   * provided by [this.getData] and the value will be of the same type as the value
   * mathcing that path in the returned object.
   */
  @Throws(Exception::class)
  abstract fun setValue(node: T, path: Array<String>, value: StatoDynamic)

  /**
   * Get the attributes for this node. This is a list of read-only string:string mapping which show
   * up inline in the elements inspector. See [Named] for more information.
   */
  @Throws(Exception::class)
  abstract fun getAttributes(node: T): List<Named<String>>

  /** Gets attributes for AX tree  */
  @Throws(Exception::class)
  open fun getAXAttributes(node: T): List<Named<String>> {
    return emptyList()
  }

  /**
   * Highlight this node. Use [HighlightedOverlay] if possible. This is used to highlight a
   * node which is selected in the inspector. The plugin automatically takes care of de-selecting
   * the previously highlighted node.
   */
  @Throws(Exception::class)
  abstract fun setHighlighted(node: T, selected: Boolean, isAlignmentMode: Boolean)

  /**
   * Perform hit testing on the given node. Either continue the search in a child with [ ][Touch.continueWithOffset] or finish the hit testing on this node with [ ][Touch.finish]
   */
  @Throws(Exception::class)
  abstract fun hitTest(node: T, touch: Touch)

  /**
   * Perform hit testing on the given ax node. Either continue the search in an ax child with [ ][Touch.continueWithOffset] or finish the hit testing on this ax node
   * with [Touch.finish]
   */
  @Throws(Exception::class)
  open fun axHitTest(node: T, touch: Touch) {
    touch.finish()
  }

  /**
   * @return A string indicating how this element should be decorated. Check with the Stato
   * desktop app to see what values are supported.
   */
  @Throws(Exception::class)
  abstract fun getDecoration(node: T): String

  /**
   * @return A string indicating how this element should be decorated in the AX tree. Check with the
   * Stato desktop app to see what values are supported.
   */
  @Throws(Exception::class)
  open fun getAXDecoration(node: T): String {
    return ""
  }

  /**
   * @return Extra data about the node indicating whether the node corresponds to a node in the
   * other tree or if it is not represented in the other tree bu has children that should show
   * up, etc.
   */
  open fun getExtraInfo(node: T): StatoObject {
    return StatoObject.Builder().build()
  }

  /**
   * Test this node against a given query to see if it matches. This is used for finding search
   * results.
   */
  @Throws(Exception::class)
  abstract fun matches(query: String, node: T): Boolean
}
