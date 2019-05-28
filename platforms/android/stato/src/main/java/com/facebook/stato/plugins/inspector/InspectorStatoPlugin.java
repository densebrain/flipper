/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package com.facebook.stato.plugins.inspector;

import android.app.Application;
import android.content.Context;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.accessibility.AccessibilityEvent;
import com.facebook.stato.core.ErrorReportingRunnable;
import com.facebook.stato.core.StatoArray;
import com.facebook.stato.core.StatoConnection;
import com.facebook.stato.core.StatoDynamic;
import com.facebook.stato.core.StatoObject;
import com.facebook.stato.core.StatoPlugin;
import com.facebook.stato.core.StatoReceiver;
import com.facebook.stato.core.StatoResponder;
import com.facebook.stato.plugins.common.MainThreadStatoReceiver;
import com.facebook.stato.plugins.console.iface.ConsoleCommandReceiver;
import com.facebook.stato.plugins.console.iface.NullScriptingEnvironment;
import com.facebook.stato.plugins.console.iface.ScriptingEnvironment;
import com.facebook.stato.plugins.inspector.descriptors.ApplicationDescriptor;
import com.facebook.stato.plugins.inspector.descriptors.utils.AccessibilityUtil;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.Nullable;

public class InspectorStatoPlugin implements StatoPlugin {

  private ApplicationWrapper mApplication;
  private DescriptorMapping mDescriptorMapping;
  private ObjectTracker mObjectTracker;
  private ScriptingEnvironment mScriptingEnvironment;
  private String mHighlightedId;
  private TouchOverlayView mTouchOverlay;
  private StatoConnection mConnection;
  private @Nullable List<ExtensionCommand> mExtensionCommands;
  private boolean mShowLithoAccessibilitySettings;

  /** An interface for extensions to the Inspector Stato plugin */
  public interface ExtensionCommand {
    /** The command to respond to */
    String command();
    /** The corresponding StatoReceiver for the command */
    StatoReceiver receiver(ObjectTracker tracker, StatoConnection connection);
  }

  private static Application getAppContextFromContext(Context context) {
    Context nonNullContext =
        context.getApplicationContext() == null ? context : context.getApplicationContext();
    return (Application) context;
  }

  public InspectorStatoPlugin(Context context, DescriptorMapping descriptorMapping) {
    this(getAppContextFromContext(context), descriptorMapping, new NullScriptingEnvironment());
  }

  public InspectorStatoPlugin(
      Context context,
      DescriptorMapping descriptorMapping,
      ScriptingEnvironment scriptingEnvironment) {
    this(
        new ApplicationWrapper(getAppContextFromContext(context)),
        descriptorMapping,
        scriptingEnvironment,
        null);
  }

  public InspectorStatoPlugin(
      Context context,
      DescriptorMapping descriptorMapping,
      @Nullable List<ExtensionCommand> extensions) {
    this(
        new ApplicationWrapper(getAppContextFromContext(context)),
        descriptorMapping,
        new NullScriptingEnvironment(),
        extensions);
  }

  public InspectorStatoPlugin(
      Context context,
      DescriptorMapping descriptorMapping,
      ScriptingEnvironment scriptingEnvironment,
      @Nullable List<ExtensionCommand> extensions) {

    this(
        new ApplicationWrapper(getAppContextFromContext(context)),
        descriptorMapping,
        scriptingEnvironment,
        extensions);
  }

  // Package visible for testing
  InspectorStatoPlugin(
      ApplicationWrapper wrapper,
      DescriptorMapping descriptorMapping,
      ScriptingEnvironment scriptingEnvironment,
      @Nullable List<ExtensionCommand> extensions) {
    mDescriptorMapping = descriptorMapping;

    mObjectTracker = new ObjectTracker();
    mApplication = wrapper;
    mScriptingEnvironment = scriptingEnvironment;
    mExtensionCommands = extensions;
    mShowLithoAccessibilitySettings = false;
  }

  @Override
  public String getId() {
    return "@stato/plugin-inspector";
  }

  @Override
  public void onConnect(StatoConnection connection) throws Exception {
    mConnection = connection;
    mDescriptorMapping.onConnect(connection);

    ConsoleCommandReceiver.listenForCommands(
        connection,
        mScriptingEnvironment,
        new ConsoleCommandReceiver.ContextProvider() {
          @Override
          @Nullable
          public Object getObjectForId(String id) {
            return mObjectTracker.get(id);
          }
        });
    connection.receive("getRoot", mGetRoot);
    connection.receive("getAllNodes", mGetAllNodes);
    connection.receive("getNodes", mGetNodes);
    connection.receive("setData", mSetData);
    connection.receive("setHighlighted", mSetHighlighted);
    connection.receive("setSearchActive", mSetSearchActive);
    connection.receive("isSearchActive", mIsSearchActive);
    connection.receive("getSearchResults", mGetSearchResults);
    connection.receive("getAXRoot", mGetAXRoot);
    connection.receive("getAXNodes", mGetAXNodes);
    connection.receive("onRequestAXFocus", mOnRequestAXFocus);
    connection.receive(
        "shouldShowLithoAccessibilitySettings", mShouldShowLithoAccessibilitySettings);

    if (mExtensionCommands != null) {
      for (ExtensionCommand extensionCommand : mExtensionCommands) {
        if (extensionCommand.command().equals("forceLithoAXRender")) {
          mShowLithoAccessibilitySettings = true;
        }
        connection.receive(
            extensionCommand.command(), extensionCommand.receiver(mObjectTracker, mConnection));
      }
    }
  }

  @Override
  public void onDisconnect() throws Exception {
    if (mHighlightedId != null) {
      setHighlighted(mHighlightedId, false, false);
      mHighlightedId = null;
    }

    // remove any added accessibility delegates, leave isSearchActive untouched
    ApplicationDescriptor.clearEditedDelegates();

    mObjectTracker.clear();
    mDescriptorMapping.onDisconnect();
    mConnection = null;
  }

  @Override
  public boolean runInBackground() {
    return true;
  }

  final StatoReceiver mShouldShowLithoAccessibilitySettings =
      new MainThreadStatoReceiver() {
        @Override
        public void onReceiveOnMainThread(StatoObject params, StatoResponder responder)
            throws Exception {
          responder.success(
              new StatoObject.Builder()
                  .put("showLithoAccessibilitySettings", mShowLithoAccessibilitySettings)
                  .build());
        }
      };

  final StatoReceiver mGetRoot =
      new MainThreadStatoReceiver() {
        @Override
        public void onReceiveOnMainThread(StatoObject params, StatoResponder responder)
            throws Exception {
          responder.success(getNode(trackObject(mApplication)));
        }
      };

  final StatoReceiver mGetAXRoot =
      new MainThreadStatoReceiver() {
        @Override
        public void onReceiveOnMainThread(StatoObject params, StatoResponder responder)
            throws Exception {
          // applicationWrapper is not used by accessibility, but is a common ancestor for multiple
          // view roots
          responder.success(getAXNode(trackObject(mApplication)));
        }
      };
  final StatoReceiver mGetAllNodes =
      new MainThreadStatoReceiver() {
        @Override
        public void onReceiveOnMainThread(
            final StatoObject params, final StatoResponder responder) throws Exception {
          final StatoObject.Builder result = new StatoObject.Builder();
          final StatoObject.Builder AXResults = new StatoObject.Builder();

          String rootID = trackObject(mApplication);
          populateAllAXNodes(rootID, AXResults);
          populateAllNodes(rootID, result);
          final StatoObject output =
              new StatoObject.Builder()
                  .put(
                      "allNodes",
                      new StatoObject.Builder()
                          .put("elements", result.build())
                          .put("AXelements", AXResults.build())
                          .put("rootElement", rootID)
                          .put("rootAXElement", rootID)
                          .build())
                  .build();
          responder.success(output);
        }
      };

  final StatoReceiver mGetNodes =
      new MainThreadStatoReceiver() {
        @Override
        public void onReceiveOnMainThread(
            final StatoObject params, final StatoResponder responder) throws Exception {
          final StatoArray ids = params.getArray("ids");
          final StatoArray.Builder result = new StatoArray.Builder();

          for (int i = 0, count = ids.length(); i < count; i++) {
            final String id = ids.getString(i);
            final StatoObject node = getNode(id);
            if (node != null) {
              result.put(node);
            } else {
              responder.error(
                  new StatoObject.Builder()
                      .put("message", "No node with given id")
                      .put("id", id)
                      .build());
              return;
            }
          }

          responder.success(new StatoObject.Builder().put("elements", result).build());
        }
      };

  void populateAllNodes(String rootNode, StatoObject.Builder builder) throws Exception {
    StatoObject object = getNode(rootNode);
    builder.put(rootNode, object);
    StatoArray children = object.getArray("children");
    for (int i = 0, count = children.length(); i < count; ++i) {
      populateAllNodes(children.getString(i), builder);
    }
  }

  void populateAllAXNodes(String rootNode, StatoObject.Builder builder) throws Exception {
    StatoObject object = getAXNode(rootNode);
    builder.put(rootNode, object);
    StatoArray children = object.getArray("children");
    for (int i = 0, count = children.length(); i < count; ++i) {
      populateAllAXNodes(children.getString(i), builder);
    }
  }

  final StatoReceiver mGetAXNodes =
      new MainThreadStatoReceiver() {
        @Override
        public void onReceiveOnMainThread(
            final StatoObject params, final StatoResponder responder) throws Exception {
          final StatoArray ids = params.getArray("ids");
          final StatoArray.Builder result = new StatoArray.Builder();

          // getNodes called to refresh accessibility focus
          final boolean forAccessibilityEvent = params.getBoolean("forAccessibilityEvent");
          final String selected = params.getString("selected");

          for (int i = 0, count = ids.length(); i < count; i++) {
            final String id = ids.getString(i);
            final StatoObject node = getAXNode(id);

            // sent request for non-existent node, potentially in error
            if (node == null) {

              // some nodes may be null since we are searching through all current and previous
              // known nodes
              if (forAccessibilityEvent) {
                continue;
              }

              responder.error(
                  new StatoObject.Builder()
                      .put("message", "No accessibility node with given id")
                      .put("id", id)
                      .build());
              return;
            } else {

              // always add currently selected node for live updates to the sidebar
              // also add focused node for updates
              if (forAccessibilityEvent) {
                if (id.equals(selected) || node.getObject("extraInfo").getBoolean("focused")) {
                  result.put(node);
                }

                // normal getNodes call, put any nodes in result
              } else {
                result.put(node);
              }
            }
          }
          responder.success(new StatoObject.Builder().put("elements", result).build());
        }
      };

  final StatoReceiver mOnRequestAXFocus =
      new MainThreadStatoReceiver() {
        @Override
        public void onReceiveOnMainThread(
            final StatoObject params, final StatoResponder responder) throws Exception {
          final String nodeId = params.getString("id");

          final Object obj = mObjectTracker.get(nodeId);
          if (obj == null || !(obj instanceof View)) {
            return;
          }

          ((View) obj).sendAccessibilityEvent(AccessibilityEvent.TYPE_VIEW_FOCUSED);
        }
      };

  final StatoReceiver mSetData =
      new MainThreadStatoReceiver() {
        @Override
        public void onReceiveOnMainThread(final StatoObject params, StatoResponder responder)
            throws Exception {
          final String nodeId = params.getString("id");
          final boolean ax = params.getBoolean("ax");
          final StatoArray keyPath = params.getArray("path");
          final StatoDynamic value = params.getDynamic("value");

          final Object obj = mObjectTracker.get(nodeId);
          if (obj == null) {
            return;
          }

          final NodeDescriptor<Object> descriptor = descriptorForObject(obj);
          if (descriptor == null) {
            return;
          }

          final int count = keyPath.length();
          final String[] path = new String[count];
          for (int i = 0; i < count; i++) {
            path[i] = keyPath.getString(i);
          }

          descriptor.setValue(obj, path, value);
          responder.success(ax ? getAXNode(nodeId) : null);
        }
      };

  final StatoReceiver mSetHighlighted =
      new MainThreadStatoReceiver() {
        @Override
        public void onReceiveOnMainThread(final StatoObject params, StatoResponder responder)
            throws Exception {
          final String nodeId = params.getString("id");
          final boolean isAlignmentMode = params.getBoolean("isAlignmentMode");

          if (mHighlightedId != null) {
            setHighlighted(mHighlightedId, false, isAlignmentMode);
          }

          if (nodeId != null) {
            setHighlighted(nodeId, true, isAlignmentMode);
          }
          mHighlightedId = nodeId;
        }
      };

  final StatoReceiver mSetSearchActive =
      new MainThreadStatoReceiver() {
        @Override
        public void onReceiveOnMainThread(final StatoObject params, StatoResponder responder)
            throws Exception {
          final boolean active = params.getBoolean("active");
          ApplicationDescriptor.setSearchActive(active);
          final List<View> roots = mApplication.getViewRoots();

          ViewGroup root = null;
          for (int i = roots.size() - 1; i >= 0; i--) {
            if (roots.get(i) instanceof ViewGroup) {
              root = (ViewGroup) roots.get(i);
              break;
            }
          }

          if (root != null) {
            if (active) {
              mTouchOverlay = new TouchOverlayView(root.getContext());
              root.addView(mTouchOverlay);
              root.bringChildToFront(mTouchOverlay);
            } else {
              root.removeView(mTouchOverlay);
              mTouchOverlay = null;
            }
          }
        }
      };

  final StatoReceiver mIsSearchActive =
      new MainThreadStatoReceiver() {
        @Override
        public void onReceiveOnMainThread(final StatoObject params, StatoResponder responder)
            throws Exception {
          responder.success(
              new StatoObject.Builder()
                  .put("isSearchActive", ApplicationDescriptor.getSearchActive())
                  .build());
        }
      };

  final StatoReceiver mGetSearchResults =
      new MainThreadStatoReceiver() {
        @Override
        public void onReceiveOnMainThread(StatoObject params, StatoResponder responder)
            throws Exception {
          final String query = params.getString("query");
          final boolean axEnabled = params.getBoolean("axEnabled");

          final SearchResultNode matchTree =
              searchTree(query.toLowerCase(), mApplication, axEnabled);
          final StatoObject results = matchTree == null ? null : matchTree.toStatoObject();
          final StatoObject response =
              new StatoObject.Builder().put("results", results).put("query", query).build();
          responder.success(response);
        }
      };

  class TouchOverlayView extends View implements HiddenNode {
    public TouchOverlayView(Context context) {
      super(context);
      setBackgroundColor(BoundsDrawable.COLOR_HIGHLIGHT_CONTENT);
    }

    @Override
    public boolean onHoverEvent(MotionEvent event) {

      // if in layout inspector and talkback is running, override the first click to locate the
      // clicked view
      if (mConnection != null
          && AccessibilityUtil.isTalkbackEnabled(getContext())
          && event.getPointerCount() == 1) {
        StatoObject params =
            new StatoObject.Builder()
                .put("type", "usage")
                .put("eventName", "accessibility:clickToInspectTalkbackRunning")
                .build();
        mConnection.send("track", params);

        final int action = event.getAction();
        switch (action) {
          case MotionEvent.ACTION_HOVER_ENTER:
            {
              event.setAction(MotionEvent.ACTION_DOWN);
            }
            break;
          case MotionEvent.ACTION_HOVER_MOVE:
            {
              event.setAction(MotionEvent.ACTION_MOVE);
            }
            break;
          case MotionEvent.ACTION_HOVER_EXIT:
            {
              event.setAction(MotionEvent.ACTION_UP);
            }
            break;
        }
        return onTouchEvent(event);
      }

      // otherwise use the default
      return super.onHoverEvent(event);
    }

    @Override
    public boolean onTouchEvent(final MotionEvent event) {
      if (event.getAction() != MotionEvent.ACTION_UP) {
        return true;
      }

      new ErrorReportingRunnable(mConnection) {
        @Override
        public void runOrThrow() throws Exception {
          hitTest((int) event.getX(), (int) event.getY());
        }
      }.run();

      return true;
    }
  }

  private Touch createTouch(final int touchX, final int touchY, final boolean ax) throws Exception {
    final StatoArray.Builder path = new StatoArray.Builder();
    path.put(trackObject(mApplication));

    return new Touch() {
      int x = touchX;
      int y = touchY;
      Object node = mApplication;

      @Override
      public void finish() {
        mConnection.send(
            ax ? "selectAX" : "select", new StatoObject.Builder().put("path", path).build());
      }

      @Override
      public void continueWithOffset(final int childIndex, final int offsetX, final int offsetY) {
        final Touch touch = this;

        new ErrorReportingRunnable(mConnection) {
          @Override
          protected void runOrThrow() throws Exception {
            x -= offsetX;
            y -= offsetY;

            if (ax) {
              node = assertNotNull(descriptorForObject(node).getAXChildAt(node, childIndex));
            } else {
              node = assertNotNull(descriptorForObject(node).getChildAt(node, childIndex));
            }

            path.put(trackObject(node));
            final NodeDescriptor<Object> descriptor = descriptorForObject(node);

            if (ax) {
              descriptor.axHitTest(node, touch);
            } else {
              descriptor.hitTest(node, touch);
            }
          }
        }.run();
      }

      @Override
      public boolean containedIn(int l, int t, int r, int b) {
        return x >= l && x <= r && y >= t && y <= b;
      }
    };
  }

  void hitTest(final int touchX, final int touchY) throws Exception {
    final NodeDescriptor<Object> descriptor = descriptorForObject(mApplication);
    descriptor.hitTest(mApplication, createTouch(touchX, touchY, false));
    descriptor.axHitTest(mApplication, createTouch(touchX, touchY, true));
  }

  private void setHighlighted(
      final String id, final boolean highlighted, final boolean isAlignmentMode) throws Exception {
    final Object obj = mObjectTracker.get(id);
    if (obj == null) {
      return;
    }

    final NodeDescriptor<Object> descriptor = descriptorForObject(obj);
    if (descriptor == null) {
      return;
    }

    descriptor.setHighlighted(obj, highlighted, isAlignmentMode);
  }

  private boolean hasAXNode(StatoObject node) {
    StatoObject extraInfo = node.getObject("extraInfo");
    return extraInfo != null && extraInfo.getBoolean("hasAXNode");
  }

  public SearchResultNode searchTree(String query, Object obj, boolean axEnabled) throws Exception {
    final NodeDescriptor descriptor = descriptorForObject(obj);
    List<SearchResultNode> childTrees = null;
    boolean isMatch = descriptor.matches(query, obj);

    for (int i = 0; i < descriptor.getChildCount(obj); i++) {
      Object child = descriptor.getChildAt(obj, i);
      SearchResultNode childNode = searchTree(query, child, axEnabled);
      if (childNode != null) {
        if (childTrees == null) {
          childTrees = new ArrayList<>();
        }
        childTrees.add(childNode);
      }
    }

    if (isMatch || childTrees != null) {
      final String id = trackObject(obj);
      StatoObject node = getNode(id);
      return new SearchResultNode(
          id, isMatch, node, childTrees, axEnabled && hasAXNode(node) ? getAXNode(id) : null);
    }
    return null;
  }

  private @Nullable StatoObject getNode(String id) throws Exception {
    final Object obj = mObjectTracker.get(id);
    if (obj == null) {
      return null;
    }

    final NodeDescriptor<Object> descriptor = descriptorForObject(obj);
    if (descriptor == null) {
      return null;
    }

    final StatoArray.Builder children = new StatoArray.Builder();
    new ErrorReportingRunnable(mConnection) {
      @Override
      protected void runOrThrow() throws Exception {
        for (int i = 0, count = descriptor.getChildCount(obj); i < count; i++) {
          final Object child = assertNotNull(descriptor.getChildAt(obj, i));
          children.put(trackObject(child));
        }
      }
    }.run();

    final StatoObject.Builder data = new StatoObject.Builder();
    new ErrorReportingRunnable(mConnection) {
      @Override
      protected void runOrThrow() throws Exception {
        for (Named<StatoObject> props : descriptor.getData(obj)) {
          data.put(props.getName(), props.getValue());
        }
      }
    }.run();

    final StatoArray.Builder attributes = new StatoArray.Builder();
    new ErrorReportingRunnable(mConnection) {
      @Override
      protected void runOrThrow() throws Exception {
        for (Named<String> attribute : descriptor.getAttributes(obj)) {
          attributes.put(
              new StatoObject.Builder()
                  .put("name", attribute.getName())
                  .put("value", attribute.getValue())
                  .build());
        }
      }
    }.run();

    return new StatoObject.Builder()
        .put("id", descriptor.getId(obj))
        .put("name", descriptor.getName(obj))
        .put("data", data)
        .put("children", children)
        .put("attributes", attributes)
        .put("decoration", descriptor.getDecoration(obj))
        .put("extraInfo", descriptor.getExtraInfo(obj))
        .build();
  }

  private @Nullable StatoObject getAXNode(String id) throws Exception {

    final Object obj = mObjectTracker.get(id);
    if (obj == null) {
      return null;
    }

    final NodeDescriptor<Object> descriptor = descriptorForObject(obj);
    if (descriptor == null) {
      return null;
    }

    final StatoArray.Builder children = new StatoArray.Builder();
    new ErrorReportingRunnable(mConnection) {
      @Override
      protected void runOrThrow() throws Exception {
        for (int i = 0, count = descriptor.getAXChildCount(obj); i < count; i++) {
          final Object child = assertNotNull(descriptor.getAXChildAt(obj, i));
          children.put(trackObject(child));
        }
      }
    }.run();

    final StatoObject.Builder data = new StatoObject.Builder();
    new ErrorReportingRunnable(mConnection) {
      @Override
      protected void runOrThrow() throws Exception {
        for (Named<StatoObject> props : descriptor.getAXData(obj)) {
          data.put(props.getName(), props.getValue());
        }
      }
    }.run();

    final StatoArray.Builder attributes = new StatoArray.Builder();
    new ErrorReportingRunnable(mConnection) {
      @Override
      protected void runOrThrow() throws Exception {
        for (Named<String> attribute : descriptor.getAXAttributes(obj)) {
          attributes.put(
              new StatoObject.Builder()
                  .put("name", attribute.getName())
                  .put("value", attribute.getValue())
                  .build());
        }
      }
    }.run();

    String name = descriptor.getAXName(obj);
    name = name.substring(name.lastIndexOf('.') + 1);

    return new StatoObject.Builder()
        .put("id", descriptor.getId(obj))
        .put("name", name)
        .put("data", data)
        .put("children", children)
        .put("attributes", attributes)
        .put("decoration", descriptor.getAXDecoration(obj))
        .put("extraInfo", descriptor.getExtraInfo(obj))
        .build();
  }

  private String trackObject(Object obj) throws Exception {
    final NodeDescriptor<Object> descriptor = descriptorForObject(obj);
    final String id = descriptor.getId(obj);
    final Object curr = mObjectTracker.get(id);
    if (obj != curr) {
      mObjectTracker.put(id, obj);
      descriptor.init(obj);
    }
    return id;
  }

  private NodeDescriptor<Object> descriptorForObject(Object obj) {
    final Class c = assertNotNull(obj).getClass();
    return (NodeDescriptor<Object>) mDescriptorMapping.descriptorForClass(c);
  }

  private static Object assertNotNull(@Nullable Object o) {
    if (o == null) {
      throw new RuntimeException("Unexpected null value");
    }
    return o;
  }
}
