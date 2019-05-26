/*
 *  Copyright (c) 2004-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.states.plugins.sandbox;

import com.facebook.states.core.StatesArray;
import com.facebook.states.core.StatesConnection;
import com.facebook.states.core.StatesObject;
import com.facebook.states.core.StatesPlugin;
import com.facebook.states.core.StatesReceiver;
import com.facebook.states.core.StatesResponder;
import java.util.Map;

public class SandboxStatesPlugin implements StatesPlugin {
  public static final String ID = "@states/plugin-sandbox";

  private static final String SET_METHOD_NAME = "setSandbox";
  private static final String GET_METHOD_NAME = "getSandbox";

  private final SandboxStatesPluginStrategy mStrategy;

  public SandboxStatesPlugin(SandboxStatesPluginStrategy strategy) {
    mStrategy = strategy;
  }

  @Override
  public String getId() {
    return ID;
  }

  @Override
  public void onConnect(StatesConnection connection) {
    connection.receive(
        GET_METHOD_NAME,
        new StatesReceiver() {
          @Override
          public void onReceive(StatesObject params, final StatesResponder responder) {
            final StatesArray.Builder sandboxes = new StatesArray.Builder();
            Map<String, String> knownSandboxes = mStrategy.getKnownSandboxes();
            if (knownSandboxes == null) {
              responder.success(sandboxes.build());
              return;
            }
            for (String sandboxName : knownSandboxes.keySet()) {
              sandboxes.put(
                  new StatesObject.Builder()
                      .put("name", sandboxName)
                      .put("value", knownSandboxes.get(sandboxName)));
            }
            responder.success(sandboxes.build());
          }
        });
    connection.receive(
        SET_METHOD_NAME,
        new StatesReceiver() {
          @Override
          public void onReceive(StatesObject params, StatesResponder responder) throws Exception {
            String sandbox = params.getString("sandbox");
            mStrategy.setSandbox(sandbox);
            responder.success(new StatesObject.Builder().put("result", true).build());
          }
        });
  }

  @Override
  public void onDisconnect() {}

    @Override
    public boolean runInBackground() {
        return false;
    }
}
