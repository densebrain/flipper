/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package org.stato.plugins.inspector

import android.annotation.SuppressLint
import android.app.Application
import android.content.Context
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.accessibility.AccessibilityEvent
import org.stato.core.*
import org.stato.plugins.common.MainThreadStatoReceiver
import org.stato.plugins.console.iface.ConsoleCommandReceiver
import org.stato.plugins.console.iface.ScriptingEnvironment
import org.stato.plugins.inspector.descriptors.ApplicationDescriptor
import org.stato.plugins.inspector.descriptors.utils.AccessibilityUtil

class InspectorStatoPlugin(
  application: Application,
  private val descriptorMapping: DescriptorMapping,
  private val scriptingEnvironment: ScriptingEnvironment,
  private val extensionCommands: List<ExtensionCommand> = listOf()
) : StatoPlugin {
  private val application = ApplicationWrapper(application)
  private val objectTracker = ObjectTracker()
  private var highlightedId: String? = null
  private var touchOverlay: TouchOverlayView? = null
  private var connection: StatoPluginConnection? = null
  private var showLithoAccessibilitySettings: Boolean = false

  override val id = "@stato/plugin-inspector"

  private val shouldShowLithoAccessibilitySettings = object : MainThreadStatoReceiver() {

    @Throws(Exception::class)
    override fun onReceiveOnMainThread(params: StatoObject, responder: StatoResponder) {
      responder.success(
        StatoObject.Builder()
          .put("showLithoAccessibilitySettings", showLithoAccessibilitySettings)
          .build())
    }
  }

  private val getRoot = object : MainThreadStatoReceiver() {

    @Throws(Exception::class)
    override fun onReceiveOnMainThread(params: StatoObject, responder: StatoResponder) {
      responder.success(getNode(trackObject(this@InspectorStatoPlugin.application))!!)
    }
  }

  private val getAXRoot = object : MainThreadStatoReceiver() {

    @Throws(Exception::class)
    override fun onReceiveOnMainThread(params: StatoObject, responder: StatoResponder) {
      // applicationWrapper is not used by accessibility, but is a common ancestor for multiple
      // view roots
      responder.success(getAXNode(trackObject(this@InspectorStatoPlugin.application)) ?: return)
    }
  }
  private val getAllNodes = object : MainThreadStatoReceiver() {

    @Throws(Exception::class)
    override fun onReceiveOnMainThread(
      params: StatoObject, responder: StatoResponder) {
      val result = StatoObject.Builder()
      val AXResults = StatoObject.Builder()

      val rootID = trackObject(this@InspectorStatoPlugin.application)
      populateAllAXNodes(rootID, AXResults)
      populateAllNodes(rootID, result)
      val output = StatoObject.Builder()
        .put(
          "allNodes",
          StatoObject.Builder()
            .put("elements", result.build())
            .put("AXelements", AXResults.build())
            .put("rootElement", rootID)
            .put("rootAXElement", rootID)
            .build())
        .build()
      responder.success(output)
    }
  }

  private val getNodes = object : MainThreadStatoReceiver() {

    @Throws(Exception::class)
    override fun onReceiveOnMainThread(
      params: StatoObject, responder: StatoResponder) {
      val ids = params.getArray("ids")
      val result = StatoArray.Builder()

      var i = 0
      val count = ids.length()
      while (i < count) {
        val id = ids.getString(i)
        val node = getNode(id)
        if (node != null) {
          result.put(node)
        } else {
          responder.error(
            StatoObject.Builder()
              .put("message", "No node with given id")
              .put("id", id)
              .build())
          return
        }
        i++
      }

      responder.success(StatoObject.Builder().put("elements", result).build())
    }
  }

  private val getAXNodes = object : MainThreadStatoReceiver() {

    @Throws(Exception::class)
    override fun onReceiveOnMainThread(
      params: StatoObject, responder: StatoResponder) {
      val ids = params.getArray("ids")
      val result = StatoArray.Builder()

      // getNodes called to refresh accessibility focus
      val forAccessibilityEvent = params.getBoolean("forAccessibilityEvent")
      val selected = params.getString("selected")

      var i = 0
      val count = ids.length()
      while (i < count) {
        val id = ids.getString(i)
        val node = getAXNode(id)

        // sent request for non-existent node, potentially in error
        if (node == null) {

          // some nodes may be null since we are searching through all current and previous
          // known nodes
          if (forAccessibilityEvent) {
            i++
            continue
          }

          responder.error(
            StatoObject.Builder()
              .put("message", "No accessibility node with given id")
              .put("id", id)
              .build())
          return
        } else {

          // always add currently selected node for live updates to the sidebar
          // also add focused node for updates
          if (forAccessibilityEvent) {
            if (id == selected || node.getObject("extraInfo").getBoolean("focused")) {
              result.put(node)
            }

            // normal getNodes call, put any nodes in result
          } else {
            result.put(node)
          }
        }
        i++
      }
      responder.success(StatoObject.Builder().put("elements", result).build())
    }
  }

  private val onRequestAXFocus = object : MainThreadStatoReceiver() {

    @Throws(Exception::class)
    override fun onReceiveOnMainThread(
      params: StatoObject, responder: StatoResponder) {
      val nodeId = params.getString("id")!!

      val obj = objectTracker[nodeId] as? View ?: return

      obj.sendAccessibilityEvent(AccessibilityEvent.TYPE_VIEW_FOCUSED)
    }
  }

  private val setData = object : MainThreadStatoReceiver() {

    @Throws(Exception::class)
    override fun onReceiveOnMainThread(params: StatoObject, responder: StatoResponder) {
      val nodeId = params.getString("id") ?: error("nodeId is null")
      val ax = params.getBoolean("ax")
      val keyPath = params.getArray("path")
      val value = params.getDynamic("value")

      val obj = objectTracker[nodeId] ?: return

      val descriptor = descriptorForObject(obj) ?: return

      val path = 0.until(keyPath.length()).map { index -> keyPath.getString(index) }

      descriptor.setValue(obj, path.toTypedArray(), value)
      responder.success((if (ax) getAXNode(nodeId) else null) ?: return)
    }
  }

  internal val setHighlighted = object : MainThreadStatoReceiver() {

    @Throws(Exception::class)
    override fun onReceiveOnMainThread(params: StatoObject, responder: StatoResponder) {
      val nodeId = params.getString("id")
      val isAlignmentMode = params.getBoolean("isAlignmentMode")

      val highlightedId = highlightedId
      if (highlightedId != null) {
        setHighlighted(highlightedId, false, isAlignmentMode)
      }

      if (nodeId != null) {
        setHighlighted(nodeId, true, isAlignmentMode)
      }
      this@InspectorStatoPlugin.highlightedId = nodeId
    }
  }

  private val setSearchActive = object : MainThreadStatoReceiver() {

    @Throws(Exception::class)
    override fun onReceiveOnMainThread(params: StatoObject, responder: StatoResponder) {
      val active = params.getBoolean("active")
      ApplicationDescriptor.searchActive = active
      val roots = this@InspectorStatoPlugin.application.viewRoots

      val root = roots.reversed().find { it is ViewGroup } as? ViewGroup

      if (root != null) {
        if (active) {
          touchOverlay = TouchOverlayView(root.context)
          root.addView(touchOverlay)
          root.bringChildToFront(touchOverlay)
        } else {
          root.removeView(touchOverlay)
          touchOverlay = null
        }
      }
    }
  }

  private val isSearchActive = object : MainThreadStatoReceiver() {

    @Throws(Exception::class)
    override fun onReceiveOnMainThread(params: StatoObject, responder: StatoResponder) {
      responder.success(
        StatoObject.Builder()
          .put("isSearchActive", ApplicationDescriptor.searchActive)
          .build()
      )
    }
  }

  private val getSearchResults = object : MainThreadStatoReceiver() {

    @Throws(Exception::class)
    override fun onReceiveOnMainThread(params: StatoObject, responder: StatoResponder) {
      val query = params.getString("query") ?: error("query null")
      val axEnabled = params.getBoolean("axEnabled")

      val matchTree = searchTree(query.toLowerCase(), this@InspectorStatoPlugin.application, axEnabled)
      val results = if (matchTree == null) null else matchTree!!.toStatoObject()
      val response = StatoObject.Builder().put("results", results).put("query", query).build()
      responder.success(response)
    }
  }

  /** An interface for extensions to the Inspector Stato plugin  */
  interface ExtensionCommand {
    /** The command to respond to  */
    fun command(): String

    /** The corresponding StatoReceiverCallback for the command  */
    fun receiver(tracker: ObjectTracker, connection: StatoPluginConnection): StatoReceiverCallback
  }

//  constructor(context: Context, descriptorMapping: DescriptorMapping) :
//    this(getAppContextFromContext(context), descriptorMapping, NullScriptingEnvironment())

  @Throws(Exception::class)
  override fun onConnect(connection: StatoPluginConnection) {
    this.connection = connection
    descriptorMapping.onConnect(connection)

    ConsoleCommandReceiver.listenForCommands(
      connection,
      scriptingEnvironment,
      object : ConsoleCommandReceiver.ContextProvider {
        override fun getObjectForId(id: String): Any? {
          return objectTracker[id]
        }
      })
    connection.receive("getRoot", getRoot)
    connection.receive("getAllNodes", getAllNodes)
    connection.receive("getNodes", getNodes)
    connection.receive("setData", setData)
    connection.receive("setHighlighted", setHighlighted)
    connection.receive("setSearchActive", setSearchActive)
    connection.receive("isSearchActive", isSearchActive)
    connection.receive("getSearchResults", getSearchResults)
    connection.receive("getAXRoot", getAXRoot)
    connection.receive("getAXNodes", getAXNodes)
    connection.receive("onRequestAXFocus", onRequestAXFocus)
    connection.receive(
      "shouldShowLithoAccessibilitySettings", shouldShowLithoAccessibilitySettings)


    extensionCommands.forEach { cmd ->
      if (cmd.command() == "forceLithoAXRender") {
        showLithoAccessibilitySettings = true
      }

      connection.receive(
        cmd.command(),
        cmd.receiver(objectTracker, connection)
      )
    }

  }

  @Throws(Exception::class)
  override fun onDisconnect() {
    val highlightedId = highlightedId
    if (highlightedId != null) {
      setHighlighted(highlightedId, false, false)
      this@InspectorStatoPlugin.highlightedId = null
    }

    // remove any added accessibility delegates, leave isSearchActive untouched
    ApplicationDescriptor.clearEditedDelegates()

    objectTracker.clear()
    descriptorMapping.onDisconnect()
    connection = null
  }

  override fun runInBackground(): Boolean {
    return true
  }

  @Throws(Exception::class)
  internal fun populateAllNodes(rootNode: String, builder: StatoObject.Builder) {
    val `object` = getNode(rootNode)
    builder.put(rootNode, `object`)
    val children = `object`!!.getArray("children")
    var i = 0
    val count = children.length()
    while (i < count) {
      populateAllNodes(children.getString(i), builder)
      ++i
    }
  }

  @Throws(Exception::class)
  internal fun populateAllAXNodes(rootNode: String, builder: StatoObject.Builder) {
    val `object` = getAXNode(rootNode)
    builder.put(rootNode, `object`)
    val children = `object`!!.getArray("children")
    var i = 0
    val count = children.length()
    while (i < count) {
      populateAllAXNodes(children.getString(i), builder)
      ++i
    }
  }

  internal inner class TouchOverlayView(context: Context) : View(context), HiddenNode {
    init {
      setBackgroundColor(BoundsDrawable.COLOR_HIGHLIGHT_CONTENT)
    }

    override fun onHoverEvent(event: MotionEvent): Boolean {

      // if in layout inspector and talkback is running, override the first click to locate the
      // clicked view
      connection?.let { connection ->
        if (AccessibilityUtil.isTalkbackEnabled(context) && event.pointerCount == 1) {

          val params = StatoObject.Builder()
            .put("type", "usage")
            .put("eventName", "accessibility:clickToInspectTalkbackRunning")
            .build()

          connection.send("track", params)

          event.action = when (event.action) {
            MotionEvent.ACTION_HOVER_ENTER ->
              MotionEvent.ACTION_DOWN

            MotionEvent.ACTION_HOVER_MOVE ->
              MotionEvent.ACTION_MOVE

            MotionEvent.ACTION_HOVER_EXIT ->
              MotionEvent.ACTION_UP

            else -> error("Unknown event: ${event}")
          }
          return@onHoverEvent onTouchEvent(event)
        }
      }

      // otherwise use the default
      return super.onHoverEvent(event)
    }

    @SuppressLint("ClickableViewAccessibility")
    override fun onTouchEvent(event: MotionEvent): Boolean {
      if (event.action != MotionEvent.ACTION_UP) {
        return true
      }

      connection?.run {
        runOrThrow<Unit> {
          hitTest(event.x.toInt(), event.y.toInt())
        }.run()
      }


      return true
    }
  }

  @Throws(Exception::class)
  private fun createTouch(touchX: Int, touchY: Int, ax: Boolean): Touch {
    val path = StatoArray.Builder()
    path.put(trackObject(application))

    return object : Touch {
      var x = touchX
      var y = touchY
      var node: Any = application

      override fun finish() {
        connection!!.send(
          if (ax) "selectAX" else "select", StatoObject.Builder().put("path", path).build())
      }

      override fun continueWithOffset(childIndex: Int, offsetX: Int, offsetY: Int) {
        val touch = this

        connection?.run {
          runOrThrow<Unit> {
            x -= offsetX
            y -= offsetY

            if (ax) {
              node = assertNotNull(descriptorForObject(node)!!.getAXChildAt(node, childIndex))
            } else {
              node = assertNotNull(descriptorForObject(node)!!.getChildAt(node, childIndex))
            }

            path.put(trackObject(node))
            val descriptor = descriptorForObject(node)

            if (ax) {
              descriptor!!.axHitTest(node, touch)
            } else {
              descriptor!!.hitTest(node, touch)
            }
          }.run()
        }

      }

      override fun containedIn(l: Int, t: Int, r: Int, b: Int): Boolean {
        return x in l..r && y >= t && y <= b
      }
    }
  }

  @Throws(Exception::class)
  internal fun hitTest(touchX: Int, touchY: Int) {
    val application = this@InspectorStatoPlugin.application
    val descriptor = descriptorForObject(application) ?: error("Descriptor is null")
    descriptor.hitTest(application, createTouch(touchX, touchY, false))
    descriptor.axHitTest(application, createTouch(touchX, touchY, true))
  }

  @Throws(Exception::class)
  private fun setHighlighted(
    id: String,
    highlighted: Boolean,
    isAlignmentMode: Boolean
  ) {
    val obj = objectTracker[id] ?: return

    val descriptor = descriptorForObject(obj) ?: return

    descriptor.setHighlighted(obj, highlighted, isAlignmentMode)
  }

  private fun hasAXNode(node: StatoObject): Boolean {
    val extraInfo = node.getObject("extraInfo")
    return extraInfo.getBoolean("hasAXNode")
  }

  @Throws(Exception::class)
  fun searchTree(query: String, obj: Any, axEnabled: Boolean): SearchResultNode? {
    val descriptor = descriptorForObject(obj) ?: error("No descriptor")
    var childTrees: MutableList<SearchResultNode>? = null
    val isMatch = descriptor.matches(query, obj)

    for (i in 0 until descriptor.getChildCount(obj)) {
      val child = descriptor.getChildAt(obj, i) ?: continue
      val childNode = searchTree(query, child, axEnabled)
      if (childNode != null) {
        if (childTrees == null) {
          childTrees = mutableListOf()
        }
        childTrees.add(childNode)
      }
    }

    if (isMatch || childTrees != null) {
      val id = trackObject(obj)
      val node = getNode(id) ?: error("no node for id ${id}")
      return SearchResultNode(
        id, isMatch, node, childTrees, (if (axEnabled && hasAXNode(node)) getAXNode(id) else null)
        ?: error("Unable to get node for ${id}"))
    }
    return null
  }

  @Throws(Exception::class)
  private fun getNode(id: String): StatoObject? {
    val obj = objectTracker[id] ?: return null

    val descriptor = descriptorForObject(obj) ?: return null

    val children = StatoArray.Builder()
    val data = StatoObject.Builder()
    val attributes = StatoArray.Builder()
    connection?.run {
      runOrThrow<Unit> {
        var i = 0
        val count = descriptor.getChildCount(obj)
        while (i < count) {
          val child = assertNotNull(descriptor.getChildAt(obj, i))
          children.put(trackObject(child))
          i++
        }
      }.run()

      runOrThrow<Unit> {
        for (props in descriptor.getData(obj)) {
          data.put(props.name, props.value)
        }
      }.run()

      runOrThrow<Unit> {
        for (attribute in descriptor.getAttributes(obj)) {
          attributes.put(
            StatoObject.Builder()
              .put("name", attribute.name)
              .put("value", attribute.value)
              .build())
        }
      }.run()
    }

    return StatoObject.Builder()
      .put("id", descriptor.getId(obj))
      .put("name", descriptor.getName(obj))
      .put("data", data)
      .put("children", children)
      .put("attributes", attributes)
      .put("decoration", descriptor.getDecoration(obj))
      .put("extraInfo", descriptor.getExtraInfo(obj))
      .build()
  }

  @Throws(Exception::class)
  private fun getAXNode(id: String): StatoObject? {

    val obj = objectTracker[id] ?: return null

    val descriptor = descriptorForObject(obj) ?: return null

    val children = StatoArray.Builder()
    val data = StatoObject.Builder()
    val attributes = StatoArray.Builder()
    connection?.run {
      runOrThrow<Unit> {
        var i = 0
        val count = descriptor.getAXChildCount(obj)
        while (i < count) {
          val child = assertNotNull(descriptor.getAXChildAt(obj, i))
          children.put(trackObject(child))
          i++
        }
      }.run()

      runOrThrow<Unit> {
        for (props in descriptor.getAXData(obj)) {
          data.put(props.name, props.value)
        }
      }.run()

      runOrThrow<Unit> {
        for (attribute in descriptor.getAXAttributes(obj)) {
          attributes.put(
            StatoObject.Builder()
              .put("name", attribute.name)
              .put("value", attribute.value)
              .build())
        }
      }.run()
    }

    var name = descriptor.getAXName(obj)
    name = name.substring(name.lastIndexOf('.') + 1)

    return StatoObject.Builder()
      .put("id", descriptor.getId(obj))
      .put("name", name)
      .put("data", data)
      .put("children", children)
      .put("attributes", attributes)
      .put("decoration", descriptor.getAXDecoration(obj))
      .put("extraInfo", descriptor.getExtraInfo(obj))
      .build()
  }

  @Throws(Exception::class)
  private fun trackObject(obj: Any): String {
    val descriptor = descriptorForObject(obj)
    val id = descriptor!!.getId(obj)
    val curr = objectTracker[id]
    if (obj !== curr) {
      objectTracker.put(id, obj)
      descriptor.init(obj)
    }
    return id
  }

  private fun descriptorForObject(obj: Any?): NodeDescriptor<Any>? {
    val c = assertNotNull(obj).javaClass
    return descriptorMapping.descriptorForClass(c)
  }

  private fun assertNotNull(o: Any?): Any {
    if (o == null) {
      throw RuntimeException("Unexpected null value")
    }
    return o
  }

  companion object {
    private fun getAppContextFromContext(context: Context): Application {
      val nonNullContext = if (context.applicationContext == null) context else context.applicationContext
      return context as Application
    }
  }
}
