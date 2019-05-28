/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.stato.plugins.console.iface;

import androidx.annotation.Nullable;
import com.facebook.stato.core.StatoConnection;
import com.facebook.stato.core.StatoObject;
import com.facebook.stato.core.StatoReceiver;
import com.facebook.stato.core.StatoResponder;
import com.facebook.stato.plugins.common.MainThreadStatoReceiver;
import org.json.JSONObject;

/**
 * Convenience class for adding console execution to a Stato Plugin. Calling {@link
 * ConsoleCommandReceiver#listenForCommands(StatoConnection, ScriptingEnvironment,
 * ContextProvider)} will add the necessary listeners for responding to command execution calls.
 */
public class ConsoleCommandReceiver {

  /**
   * Incoming command execution calls may reference a context ID that means something to your
   * plugin. Implement {@link ContextProvider} to provide a mapping from context ID to java object.
   * This will allow your Stato plugin to control the execution context of the command.
   */
  public interface ContextProvider {
    @Nullable
    Object getObjectForId(String id);
  }

  public static void listenForCommands(
      final StatoConnection connection,
      final ScriptingEnvironment scriptingEnvironment,
      final ContextProvider contextProvider) {

    final ScriptingSession session = scriptingEnvironment.startSession();
    final StatoReceiver executeCommandReceiver =
        new MainThreadStatoReceiver() {
          @Override
          public void onReceiveOnMainThread(StatoObject params, StatoResponder responder)
              throws Exception {
            final String command = params.getString("command");
            final String contextObjectId = params.getString("context");
            final Object contextObject = contextProvider.getObjectForId(contextObjectId);
            try {
              JSONObject o =
                  contextObject == null
                      ? session.evaluateCommand(command)
                      : session.evaluateCommand(command, contextObject);
              responder.success(new StatoObject(o));
            } catch (Exception e) {
              responder.error(new StatoObject.Builder().put("message", e.getMessage()).build());
            }
          }
        };
    final StatoReceiver isEnabledReceiver =
        new StatoReceiver() {
          @Override
          public void onReceive(StatoObject params, StatoResponder responder) throws Exception {
            responder.success(
                new StatoObject.Builder()
                    .put("isEnabled", scriptingEnvironment.isEnabled())
                    .build());
          }
        };

    connection.receive("executeCommand", executeCommandReceiver);
    connection.receive("isConsoleEnabled", isEnabledReceiver);
  }

  public static void listenForCommands(
      StatoConnection connection, ScriptingEnvironment scriptingEnvironment) {
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
