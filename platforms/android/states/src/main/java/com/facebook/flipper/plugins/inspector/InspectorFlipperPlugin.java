/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package com.facebook.states.plugins.inspector;

import android.app.Application;
import android.content.Context;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.accessibility.AccessibilityEvent;
import com.facebook.states.core.ErrorReportingRunnable;
import com.facebook.states.core.StatesArray;
import com.facebook.states.core.StatesConnection;
import com.facebook.states.core.StatesDynamic;
import com.facebook.states.core.StatesObject;
import com.facebook.states.core.StatesPlugin;
import com.facebook.states.core.StatesReceiver;
import com.facebook.states.core.StatesResponder;
import com.facebook.states.plugins.common.MainThreadStatesReceiver;
import com.facebook.states.plugins.console.iface.ConsoleCommandReceiver;
import com.facebook.states.plugins.console.iface.NullScriptingEnvironment;
import com.facebook.states.plugins.console.iface.ScriptingEnvironment;
import com.facebook.states.plugins.inspector.descriptors.ApplicationDescriptor;
import com.facebook.states.plugins.inspector.descriptors.utils.AccessibilityUtil;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.Nullable;

public class InspectorStatesPlugin implements StatesPlugin {

  private ApplicationWrapper mApplication;
  private DescriptorMapping mDescriptorMapping;
  private ObjectTracker mObjectTracker;
  private ScriptingEnvironment mScriptingEnvironment;
  private String mHighlightedId;
  private TouchOverlayView mTouchOverlay;
  private StatesConnection mConnection;
  private @Nullable List<ExtensionCommand> mExtensionCommands;
  private boolean mShowLithoAccessibilitySettings;

  /** An interface for extensions to the Inspector States plugin */
  public interface ExtensionCommand {
    /** The command to respond to */
    String command();
    /** The corresponding StatesReceiver for the command */
    StatesReceiver receiver(ObjectTracker tracker, StatesConnection connection);
  }

  private static Application getAppContextFromContext(Context context) {
    Context nonNullContext =
        context.getApplicationContext() == null ? context : context.getApplicationContext();
    return (Application) context;
  }

  public InspectorStatesPlugin(Context context, DescriptorMapping descriptorMapping) {
    this(getAppContextFromContext(context), descriptorMapping, new NullScriptingEnvironment());
  }

  public InspectorStatesPlugin(
      Context context,
      DescriptorMapping descriptorMapping,
      ScriptingEnvironment scriptingEnvironment) {
    this(
        new ApplicationWrapper(getAppContextFromContext(context)),
        descriptorMapping,
        scriptingEnvironment,
        null);
  }

  public InspectorStatesPlugin(
      Context context,
      DescriptorMapping descriptorMapping,
      @Nullable List<ExtensionCommand> extensions) {
    this(
        new ApplicationWrapper(getAppContextFromContext(context)),
        descriptorMapping,
        new NullScriptingEnvironment(),
        extensions);
  }

  public InspectorStatesPlugin(
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
  InspectorStatesPlugin(
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
    return "@states/plugin-inspector";
  }

  @Override
  public void onConnect(StatesConnection connection) throws Exception {
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

  final StatesReceiver mShouldShowLithoAccessibilitySettings =
      new MainThreadStatesReceiver() {
        @Override
        public void onReceiveOnMainThread(StatesObject params, StatesResponder responder)
            throws Exception {
          responder.success(
              new StatesObject.Builder()
                  .put("showLithoAccessibilitySettings", mShowLithoAccessibilitySettings)
                  .build());
        }
      };

  final StatesReceiver mGetRoot =
      new MainThreadStatesReceiver() {
        @Override
        public void onReceiveOnMainThread(StatesObject params, StatesResponder responder)
            throws Exception {
          responder.success(getNode(trackObject(mApplication)));
        }
      };

  final StatesReceiver mGetAXRoot =
      new MainThreadStatesReceiver() {
        @Override
        public void onReceiveOnMainThread(StatesObject params, StatesResponder responder)
            throws Exception {
          // applicationWrapper is not used by accessibility, but is a common ancestor for multiple
          // view roots
          responder.success(getAXNode(trackObject(mApplication)));
        }
      };
  final StatesReceiver mGetAllNodes =
      new MainThreadStatesReceiver() {
        @Override
        public void onReceiveOnMainThread(
            final StatesObject params, final StatesResponder responder) throws Exception {
          final StatesObject.Builder result = new StatesObject.Builder();
          final StatesObject.Builder AXResults = new StatesObject.Builder();

          String rootID = trackObject(mApplication);
          populateAllAXNodes(rootID, AXResults);
          populateAllNodes(rootID, result);
          final StatesObject output =
              new StatesObject.Builder()
                  .put(
                      "allNodes",
                      new StatesObject.Builder()
                          .put("elements", result.build())
                          .put("AXelements", AXResults.build())
                          .put("rootElement", rootID)
                          .put("rootAXElement", rootID)
                          .build())
                  .build();
          responder.success(output);
        }
      };

  final StatesReceiver mGetNodes =
      new MainThreadStatesReceiver() {
        @Override
        public void onReceiveOnMainThread(
            final StatesObject params, final StatesResponder responder) throws Exception {
          final StatesArray ids = params.getArray("ids");
          final StatesArray.Builder result = new StatesArray.Builder();

          for (int i = 0, count = ids.length(); i < count; i++) {
            final String id = ids.getString(i);
            final StatesObject node = getNode(id);
            if (node != null) {
              result.put(node);
            } else {
              responder.error(
                  new StatesObject.Builder()
                      .put("message", "No node with given id")
                      .put("id", id)
                      .build());
              return;
            }
          }

          responder.success(new StatesObject.Builder().put("elements", result).build());
        }
      };

  void populateAllNodes(String rootNode, StatesObject.Builder builder) throws Exception {
    StatesObject object = getNode(rootNode);
    builder.put(rootNode, object);
    StatesArray children = object.getArray("children");
    for (int i = 0, count = children.length(); i < count; ++i) {
      populateAllNodes(children.getString(i), builder);
    }
  }

  void populateAllAXNodes(String rootNode, StatesObject.Builder builder) throws Exception {
    StatesObject object = getAXNode(rootNode);
    builder.put(rootNode, object);
    StatesArray children = object.getArray("children");
    for (int i = 0, count = children.length(); i < count; ++i) {
      populateAllAXNodes(children.getString(i), builder);
    }
  }

  final StatesReceiver mGetAXNodes =
      new MainThreadStatesReceiver() {
        @Override
        public void onReceiveOnMainThread(
            final StatesObject params, final StatesResponder responder) throws Exception {
          final StatesArray ids = params.getArray("ids");
          final StatesArray.Builder result = new StatesArray.Builder();

          // getNodes called to refresh accessibility focus
          final boolean forAccessibilityEvent = params.getBoolean("forAccessibilityEvent");
          final String selected = params.getString("selected");

          for (int i = 0, count = ids.length(); i < count; i++) {
            final String id = ids.getString(i);
            final StatesObject node = getAXNode(id);

            // sent request for non-existent node, potentially in error
            if (node == null) {

              // some nodes may be null since we are searching through all current and previous
              // known nodes
              if (forAccessibilityEvent) {
                continue;
              }

              responder.error(
                  new StatesObject.Builder()
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
          responder.success(new StatesObject.Builder().put("elements", result).build());
        }
      };

  final StatesReceiver mOnRequestAXFocus =
      new MainThreadStatesReceiver() {
        @Override
        public void onReceiveOnMainThread(
            final StatesObject params, final StatesResponder responder) throws Exception {
          final String nodeId = params.getString("id");

          final Object obj = mObjectTracker.get(nodeId);
          if (obj == null || !(obj instanceof View)) {
            return;
          }

          ((View) obj).sendAccessibilityEvent(AccessibilityEvent.TYPE_VIEW_FOCUSED);
        }
      };

  final StatesReceiver mSetData =
      new MainThreadStatesReceiver() {
        @Override
        public void onReceiveOnMainThread(final StatesObject params, StatesResponder responder)
            throws Exception {
          final String nodeId = params.getString("id");
          final boolean ax = params.getBoolean("ax");
          final StatesArray keyPath = params.getArray("path");
          final StatesDynamic value = params.getDynamic("value");

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

  final StatesReceiver mSetHighlighted =
      new MainThreadStatesReceiver() {
        @Override
        public void onReceiveOnMainThread(final StatesObject params, StatesResponder responder)
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

  final StatesReceiver mSetSearchActive =
      new MainThreadStatesReceiver() {
        @Override
        public void onReceiveOnMainThread(final StatesObject params, StatesResponder responder)
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

  final StatesReceiver mIsSearchActive =
      new MainThreadStatesReceiver() {
        @Override
        public void onReceiveOnMainThread(final StatesObject params, StatesResponder responder)
            throws Exception {
          responder.success(
              new StatesObject.Builder()
                  .put("isSearchActive", ApplicationDescriptor.getSearchActive())
                  .build());
        }
      };

  final StatesReceiver mGetSearchResults =
      new MainThreadStatesReceiver() {
        @Override
        public void onReceiveOnMainThread(StatesObject params, StatesResponder responder)
            throws Exception {
          final String query = params.getString("query");
          final boolean axEnabled = params.getBoolean("axEnabled");

          final SearchResultNode matchTree =
              searchTree(query.toLowerCase(), mApplication, axEnabled);
          final StatesObject results = matchTree == null ? null : matchTree.toStatesObject();
          final StatesObject response =
              new StatesObject.Builder().put("results", results).put("query", query).build();
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
        StatesObject params =
            new StatesObject.Builder()
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
    final StatesArray.Builder path = new StatesArray.Builder();
    path.put(trackObject(mApplication));

    return new Touch() {
      int x = touchX;
      int y = touchY;
      Object node = mApplication;

      @Override
      public void finish() {
        mConnection.send(
            ax ? "selectAX" : "select", new StatesObject.Builder().put("path", path).build());
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

  private boolean hasAXNode(StatesObject node) {
    StatesObject extraInfo = node.getObject("extraInfo");
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
      StatesObject node = getNode(id);
      return new SearchResultNode(
          id, isMatch, node, childTrees, axEnabled && hasAXNode(node) ? getAXNode(id) : null);
    }
    return null;
  }

  private @Nullable StatesObject getNode(String id) throws Exception {
    final Object obj = mObjectTracker.get(id);
    if (obj == null) {
      return null;
    }

    final NodeDescriptor<Object> descriptor = descriptorForObject(obj);
    if (descriptor == null) {
      return null;
    }

    final StatesArray.Builder children = new StatesArray.Builder();
    new ErrorReportingRunnable(mConnection) {
      @Override
      protected void runOrThrow() throws Exception {
        for (int i = 0, count = descriptor.getChildCount(obj); i < count; i++) {
          final Object child = assertNotNull(descriptor.getChildAt(obj, i));
          children.put(trackObject(child));
        }
      }
    }.run();

    final StatesObject.Builder data = new StatesObject.Builder();
    new ErrorReportingRunnable(mConnection) {
      @Override
      protected void runOrThrow() throws Exception {
        for (Named<StatesObject> props : descriptor.getData(obj)) {
          data.put(props.getName(), props.getValue());
        }
      }
    }.run();

    final StatesArray.Builder attributes = new StatesArray.Builder();
    new ErrorReportingRunnable(mConnection) {
      @Override
      protected void runOrThrow() throws Exception {
        for (Named<String> attribute : descriptor.getAttributes(obj)) {
          attributes.put(
              new StatesObject.Builder()
                  .put("name", attribute.getName())
                  .put("value", attribute.getValue())
                  .build());
        }
      }
    }.run();

    return new StatesObject.Builder()
        .put("id", descriptor.getId(obj))
        .put("name", descriptor.getName(obj))
        .put("data", data)
        .put("children", children)
        .put("attributes", attributes)
        .put("decoration", descriptor.getDecoration(obj))
        .put("extraInfo", descriptor.getExtraInfo(obj))
        .build();
  }

  private @Nullable StatesObject getAXNode(String id) throws Exception {

    final Object obj = mObjectTracker.get(id);
    if (obj == null) {
      return null;
    }

    final NodeDescriptor<Object> descriptor = descriptorForObject(obj);
    if (descriptor == null) {
      return null;
    }

    final StatesArray.Builder children = new StatesArray.Builder();
    new ErrorReportingRunnable(mConnection) {
      @Override
      protected void runOrThrow() throws Exception {
        for (int i = 0, count = descriptor.getAXChildCount(obj); i < count; i++) {
          final Object child = assertNotNull(descriptor.getAXChildAt(obj, i));
          children.put(trackObject(child));
        }
      }
    }.run();

    final StatesObject.Builder data = new StatesObject.Builder();
    new ErrorReportingRunnable(mConnection) {
      @Override
      protected void runOrThrow() throws Exception {
        for (Named<StatesObject> props : descriptor.getAXData(obj)) {
          data.put(props.getName(), props.getValue());
        }
      }
    }.run();

    final StatesArray.Builder attributes = new StatesArray.Builder();
    new ErrorReportingRunnable(mConnection) {
      @Override
      protected void runOrThrow() throws Exception {
        for (Named<String> attribute : descriptor.getAXAttributes(obj)) {
          attributes.put(
              new StatesObject.Builder()
                  .put("name", attribute.getName())
                  .put("value", attribute.getValue())
                  .build());
        }
      }
    }.run();

    String name = descriptor.getAXName(obj);
    name = name.substring(name.lastIndexOf('.') + 1);

    return new StatesObject.Builder()
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
