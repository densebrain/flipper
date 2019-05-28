/*
 *  Copyright (c) 2004-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.stato.plugins.sandbox;

import com.facebook.stato.core.StatoArray;
import com.facebook.stato.core.StatoConnection;
import com.facebook.stato.core.StatoObject;
import com.facebook.stato.core.StatoPlugin;
import com.facebook.stato.core.StatoReceiver;
import com.facebook.stato.core.StatoResponder;
import java.util.Map;

public class SandboxStatoPlugin implements StatoPlugin {
  public static final String ID = "@stato/plugin-sandbox";

  private static final String SET_METHOD_NAME = "setSandbox";
  private static final String GET_METHOD_NAME = "getSandbox";

  private final SandboxStatoPluginStrategy mStrategy;

  public SandboxStatoPlugin(SandboxStatoPluginStrategy strategy) {
    mStrategy = strategy;
  }

  @Override
  public String getId() {
    return ID;
  }

  @Override
  public void onConnect(StatoConnection connection) {
    connection.receive(
        GET_METHOD_NAME,
        new StatoReceiver() {
          @Override
          public void onReceive(StatoObject params, final StatoResponder responder) {
            final StatoArray.Builder sandboxes = new StatoArray.Builder();
            Map<String, String> knownSandboxes = mStrategy.getKnownSandboxes();
            if (knownSandboxes == null) {
              responder.success(sandboxes.build());
              return;
            }
            for (String sandboxName : knownSandboxes.keySet()) {
              sandboxes.put(
                  new StatoObject.Builder()
                      .put("name", sandboxName)
                      .put("value", knownSandboxes.get(sandboxName)));
            }
            responder.success(sandboxes.build());
          }
        });
    connection.receive(
        SET_METHOD_NAME,
        new StatoReceiver() {
          @Override
          public void onReceive(StatoObject params, StatoResponder responder) throws Exception {
            String sandbox = params.getString("sandbox");
            mStrategy.setSandbox(sandbox);
            responder.success(new StatoObject.Builder().put("result", true).build());
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
