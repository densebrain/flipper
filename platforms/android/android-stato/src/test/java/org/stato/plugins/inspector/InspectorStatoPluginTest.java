/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.plugins.inspector;

import static org.stato.plugins.inspector.ThrowableMessageMatcher.hasThrowableWithMessage;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.CoreMatchers.hasItem;
import static org.hamcrest.MatcherAssert.assertThat;

import android.app.Application;
import android.graphics.Rect;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import org.stato.core.StatoArray;
import org.stato.core.StatoPluginConnection;
import org.stato.core.StatoDynamic;
import org.stato.core.StatoObject;
import org.stato.plugins.console.iface.NullScriptingEnvironment;
import org.stato.plugins.console.iface.ScriptingEnvironment;
import org.stato.plugins.inspector.InspectorStatoPlugin.TouchOverlayView;
import org.stato.plugins.inspector.descriptors.ApplicationDescriptor;
import org.stato.testing.StatoPluginConnectionMock;
import org.stato.testing.StatoResponderMock;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import javax.annotation.Nullable;
import org.hamcrest.CoreMatchers;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;

@RunWith(RobolectricTestRunner.class)
public class InspectorStatoPluginTest {

  private MockApplicationDescriptor mApplicationDescriptor;
  private DescriptorMapping mDescriptorMapping;
  private ApplicationWrapper mApp;
  private ScriptingEnvironment mScriptingEnvironment;

  @Before
  public void setup() {
    final Application app = Mockito.spy(RuntimeEnvironment.application);
    Mockito.when(app.getApplicationContext()).thenReturn(app);
    Mockito.when(app.getPackageName()).thenReturn("org.stato");

    mDescriptorMapping = new DescriptorMapping();
    mApplicationDescriptor = new MockApplicationDescriptor();
    mDescriptorMapping.register(ApplicationWrapper.class, mApplicationDescriptor);
    mDescriptorMapping.register(TestNode.class, new TestNodeDescriptor());
    mScriptingEnvironment = new NullScriptingEnvironment();
    mApp = Mockito.spy(new ApplicationWrapper(app));
  }

  @Test
  public void testOnConnect() throws Exception {
    final InspectorStatoPlugin plugin =
        new InspectorStatoPlugin(mApp, mDescriptorMapping, mScriptingEnvironment, null);
    final StatoPluginConnection connection = new StatoPluginConnectionMock();

    plugin.onConnect(connection);
    assertThat(mApplicationDescriptor.connected(), equalTo(true));
  }

  @Test
  public void testOnDisconnect() throws Exception {
    final InspectorStatoPlugin plugin =
        new InspectorStatoPlugin(mApp, mDescriptorMapping, mScriptingEnvironment, null);
    final StatoPluginConnection connection = new StatoPluginConnectionMock();

    plugin.onConnect(connection);
    plugin.onDisconnect();
    assertThat(mApplicationDescriptor.connected(), equalTo(false));
  }

  @Test
  public void testGetRoot() throws Exception {
    final InspectorStatoPlugin plugin =
        new InspectorStatoPlugin(mApp, mDescriptorMapping, mScriptingEnvironment, null);
    final StatoResponderMock responder = new StatoResponderMock();
    final StatoPluginConnectionMock connection = new StatoPluginConnectionMock();
    plugin.onConnect(connection);

    final TestNode root = new TestNode();
    root.id = "test";
    mApplicationDescriptor.root = root;
    plugin.mGetRoot.onReceive(null, responder);

    assertThat(
        responder.successes,
        hasItem(
            new StatoObject.Builder()
                .put("id", "org.stato")
                .put("name", "org.stato")
                .put("data", new StatoObject.Builder())
                .put("children", new StatoArray.Builder().put("test"))
                .put("attributes", new StatoArray.Builder())
                .put("decoration", (String) null)
                .put("extraInfo", new StatoObject.Builder().put("hasAXNode", true))
                .build()));
  }

  @Test
  public void testGetNodes() throws Exception {
    final InspectorStatoPlugin plugin =
        new InspectorStatoPlugin(mApp, mDescriptorMapping, mScriptingEnvironment, null);
    final StatoResponderMock responder = new StatoResponderMock();
    final StatoPluginConnectionMock connection = new StatoPluginConnectionMock();
    plugin.onConnect(connection);

    final TestNode root = new TestNode();
    root.id = "test";
    root.name = "test";
    mApplicationDescriptor.root = root;

    plugin.mGetRoot.onReceive(null, responder);
    plugin.mGetNodes.onReceive(
        new StatoObject.Builder().put("ids", new StatoArray.Builder().put("test")).build(),
        responder);

    assertThat(
        responder.successes,
        hasItem(
            new StatoObject.Builder()
                .put(
                    "elements",
                    new StatoArray.Builder()
                        .put(
                            new StatoObject.Builder()
                                .put("id", "test")
                                .put("name", "test")
                                .put("data", new StatoObject.Builder())
                                .put("children", new StatoArray.Builder())
                                .put("attributes", new StatoArray.Builder())
                                .put("decoration", (String) null)
                                .put("extraInfo", new StatoObject.Builder())))
                .build()));
  }

  @Test
  public void testGetNodesThatDontExist() throws Exception {
    final InspectorStatoPlugin plugin =
        new InspectorStatoPlugin(mApp, mDescriptorMapping, mScriptingEnvironment, null);
    final StatoResponderMock responder = new StatoResponderMock();
    final StatoPluginConnectionMock connection = new StatoPluginConnectionMock();
    plugin.onConnect(connection);

    final TestNode root = new TestNode();
    root.id = "test";
    mApplicationDescriptor.root = root;

    plugin.mGetRoot.onReceive(null, responder);
    plugin.mGetNodes.onReceive(
        new StatoObject.Builder().put("ids", new StatoArray.Builder().put("notest")).build(),
        responder);

    assertThat(
        responder.errors,
        hasItem(
            new StatoObject.Builder()
                .put("message", "No node with given id")
                .put("id", "notest")
                .build()));
  }

  @Test
  public void testSetData() throws Exception {
    final InspectorStatoPlugin plugin =
        new InspectorStatoPlugin(mApp, mDescriptorMapping, mScriptingEnvironment, null);
    final StatoPluginConnectionMock connection = new StatoPluginConnectionMock();
    final StatoResponderMock responder = new StatoResponderMock();
    plugin.onConnect(connection);

    final TestNode root = new TestNode();
    root.id = "test";
    root.data = new StatoObject.Builder().put("prop", "value").build();

    mApplicationDescriptor.root = root;

    plugin.mGetRoot.onReceive(null, responder);
    plugin.mSetData.onReceive(
        new StatoObject.Builder()
            .put("id", "test")
            .put("path", new StatoArray.Builder().put("data"))
            .put("value", new StatoObject.Builder().put("prop", "updated_value"))
            .build(),
        responder);

    assertThat(root.data.getString("prop"), equalTo("updated_value"));
    assertThat(
        connection.sent.get("invalidate"),
        hasItem(
            new StatoObject.Builder()
                .put(
                    "nodes",
                    new StatoArray.Builder()
                        .put(new StatoObject.Builder().put("id", "test").build())
                        .build())
                .build()));
  }

  @Test
  public void testSetHighlighted() throws Exception {
    final InspectorStatoPlugin plugin =
        new InspectorStatoPlugin(mApp, mDescriptorMapping, mScriptingEnvironment, null);
    final StatoPluginConnectionMock connection = new StatoPluginConnectionMock();
    final StatoResponderMock responder = new StatoResponderMock();
    plugin.onConnect(connection);

    final TestNode root = new TestNode();
    root.id = "test";
    mApplicationDescriptor.root = root;

    plugin.mGetRoot.onReceive(null, responder);
    plugin.mSetHighlighted.onReceive(
        new StatoObject.Builder().put("id", "org.stato").build(), responder);

    assertThat(mApplicationDescriptor.highlighted, equalTo(true));

    plugin.mSetHighlighted.onReceive(
        new StatoObject.Builder().put("id", "test").build(), responder);

    assertThat(mApplicationDescriptor.highlighted, equalTo(false));
    assertThat(root.highlighted, equalTo(true));

    plugin.onDisconnect();

    assertThat(root.highlighted, equalTo(false));
  }

  @Test
  public void testHitTest() throws Exception {
    final InspectorStatoPlugin plugin =
        new InspectorStatoPlugin(mApp, mDescriptorMapping, mScriptingEnvironment, null);
    final StatoPluginConnectionMock connection = new StatoPluginConnectionMock();
    plugin.onConnect(connection);

    final TestNode one = new TestNode();
    one.id = "1";
    one.bounds.set(5, 5, 20, 20);

    final TestNode two = new TestNode();
    two.id = "2";
    two.bounds.set(20, 20, 100, 100);

    final TestNode three = new TestNode();
    three.id = "3";
    three.bounds.set(0, 0, 20, 20);

    final TestNode root = new TestNode();
    root.id = "test";
    root.children.add(one);
    root.children.add(two);
    root.children.add(three);
    mApplicationDescriptor.root = root;

    plugin.hitTest(10, 10);

    assertThat(
        connection.sent.get("select"),
        hasItem(
            new StatoObject.Builder()
                .put(
                    "path",
                    new StatoArray.Builder().put("org.stato").put("test").put("3"))
                .build()));
  }

  @Test
  public void testSetSearchActive() throws Exception {
    final InspectorStatoPlugin plugin =
        new InspectorStatoPlugin(mApp, mDescriptorMapping, mScriptingEnvironment, null);
    final StatoPluginConnectionMock connection = new StatoPluginConnectionMock();
    final StatoResponderMock responder = new StatoResponderMock();
    plugin.onConnect(connection);

    final ViewGroup decorView = Mockito.spy(new FrameLayout(mApp.getApplication()));
    Mockito.when(mApp.getViewRoots()).thenReturn(Arrays.<View>asList(decorView));

    plugin.mSetSearchActive.onReceive(
        new StatoObject.Builder().put("active", true).build(), responder);

    Mockito.verify(decorView, Mockito.times(1)).addView(Mockito.any(TouchOverlayView.class));

    plugin.mSetSearchActive.onReceive(
        new StatoObject.Builder().put("active", false).build(), responder);

    Mockito.verify(decorView, Mockito.times(1)).removeView(Mockito.any(TouchOverlayView.class));
  }

  @Test
  public void testNullChildThrows() throws Exception {
    final InspectorStatoPlugin plugin =
        new InspectorStatoPlugin(mApp, mDescriptorMapping, mScriptingEnvironment, null);
    final StatoResponderMock responder = new StatoResponderMock();
    final StatoPluginConnectionMock connection = new StatoPluginConnectionMock();
    plugin.onConnect(connection);

    final TestNode root = new TestNode();
    root.id = "test";
    root.name = "test";
    root.children = new ArrayList<>(1);
    root.children.add(null);
    mApplicationDescriptor.root = root;

    plugin.mGetRoot.onReceive(null, responder);
    plugin.mGetNodes.onReceive(
        new StatoObject.Builder().put("ids", new StatoArray.Builder().put("test")).build(),
        responder);

    assertThat(
        connection.errors, CoreMatchers.hasItem(hasThrowableWithMessage("Unexpected null value")));
  }

  private class TestNode {
    String id;
    String name;
    List<TestNode> children = new ArrayList<>();
    StatoObject data;
    List<Named<String>> atttributes = new ArrayList<>();
    String decoration;
    boolean highlighted;
    Rect bounds = new Rect();
  }

  private class TestNodeDescriptor extends NodeDescriptor<TestNode> {

    @Override
    public void init(TestNode node) {}

    @Override
    public String getId(TestNode node) {
      return node.id;
    }

    @Override
    public String getName(TestNode node) {
      return node.name;
    }

    @Override
    public int getChildCount(TestNode node) {
      return node.children.size();
    }

    @Override
    public Object getChildAt(TestNode node, int index) {
      return node.children.get(index);
    }

    @Nullable
    @Override
    public Object getAXChildAt(TestNode node, int index) throws Exception {
      return node.children.get(index);
    }

    @Override
    public List<Named<StatoObject>> getData(TestNode node) {
      return Collections.singletonList(new Named<>("data", node.data));
    }

    @Override
    public void setValue(TestNode node, String[] path, StatoDynamic value) throws Exception {
      if (path[0].equals("data")) {
        node.data = value.asObject();
      }
      invalidate(node);
    }

    @Override
    public List<Named<String>> getAttributes(TestNode node) {
      return node.atttributes;
    }

    @Override
    public void setHighlighted(TestNode testNode, boolean b, boolean b1) throws Exception {
      testNode.highlighted = b;
    }

    @Override
    public void hitTest(TestNode node, Touch touch) {
      for (int i = node.children.size() - 1; i >= 0; i--) {
        final TestNode child = node.children.get(i);
        final Rect bounds = child.bounds;
        if (touch.containedIn(bounds.left, bounds.top, bounds.right, bounds.bottom)) {
          touch.continueWithOffset(i, bounds.left, bounds.top);
          return;
        }
      }

      touch.finish();
    }

    @Override
    public String getDecoration(TestNode node) {
      return node.decoration;
    }

    @Override
    public boolean matches(String query, TestNode node) {
      return getName(node).contains(query);
    }
  }

  private class MockApplicationDescriptor extends ApplicationDescriptor {
    TestNode root;
    boolean highlighted;

    @Override
    public int getChildCount(ApplicationWrapper node) {
      return 1;
    }

    @Override
    public Object getChildAt(ApplicationWrapper node, int index) {
      return root;
    }

    @Nullable
    @Override
    public Object getAXChildAt(ApplicationWrapper node, int index) {
      return root;
    }

    @Override
    public void setHighlighted(ApplicationWrapper node, boolean selected, boolean isAlignmentMode) {
      highlighted = selected;
    }

    @Override
    public void hitTest(ApplicationWrapper node, Touch touch) {
      touch.continueWithOffset(0, 0, 0);
    }
  }
}
