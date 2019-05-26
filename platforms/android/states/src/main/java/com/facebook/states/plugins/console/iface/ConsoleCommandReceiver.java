/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.states.plugins.console.iface;

import androidx.annotation.Nullable;
import com.facebook.states.core.StatesConnection;
import com.facebook.states.core.StatesObject;
import com.facebook.states.core.StatesReceiver;
import com.facebook.states.core.StatesResponder;
import com.facebook.states.plugins.common.MainThreadStatesReceiver;
import org.json.JSONObject;

/**
 * Convenience class for adding console execution to a States Plugin. Calling {@link
 * ConsoleCommandReceiver#listenForCommands(StatesConnection, ScriptingEnvironment,
 * ContextProvider)} will add the necessary listeners for responding to command execution calls.
 */
public class ConsoleCommandReceiver {

  /**
   * Incoming command execution calls may reference a context ID that means something to your
   * plugin. Implement {@link ContextProvider} to provide a mapping from context ID to java object.
   * This will allow your States plugin to control the execution context of the command.
   */
  public interface ContextProvider {
    @Nullable
    Object getObjectForId(String id);
  }

  public static void listenForCommands(
      final StatesConnection connection,
      final ScriptingEnvironment scriptingEnvironment,
      final ContextProvider contextProvider) {

    final ScriptingSession session = scriptingEnvironment.startSession();
    final StatesReceiver executeCommandReceiver =
        new MainThreadStatesReceiver() {
          @Override
          public void onReceiveOnMainThread(StatesObject params, StatesResponder responder)
              throws Exception {
            final String command = params.getString("command");
            final String contextObjectId = params.getString("context");
            final Object contextObject = contextProvider.getObjectForId(contextObjectId);
            try {
              JSONObject o =
                  contextObject == null
                      ? session.evaluateCommand(command)
                      : session.evaluateCommand(command, contextObject);
              responder.success(new StatesObject(o));
            } catch (Exception e) {
              responder.error(new StatesObject.Builder().put("message", e.getMessage()).build());
            }
          }
        };
    final StatesReceiver isEnabledReceiver =
        new StatesReceiver() {
          @Override
          public void onReceive(StatesObject params, StatesResponder responder) throws Exception {
            responder.success(
                new StatesObject.Builder()
                    .put("isEnabled", scriptingEnvironment.isEnabled())
                    .build());
          }
        };

    connection.receive("executeCommand", executeCommandReceiver);
    connection.receive("isConsoleEnabled", isEnabledReceiver);
  }

  public static void listenForCommands(
      StatesConnection connection, ScriptingEnvironment scriptingEnvironment) {
    listenForCommands(connection, scriptingEnvironment, nullContextProvider);
  }

  private static final ContextProvider nullContextProvider =
      new ContextProvider() {
        @Override
        @Nullable
        public Object getObjectForId(String id) {
          return null;
        }
      };
}
