/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.plugins.console

import org.stato.plugins.console.iface.ScriptingSession
import java.io.Closeable
import java.util.concurrent.atomic.AtomicInteger
import org.json.JSONException
import org.json.JSONObject
import org.json.JSONTokener
import org.mozilla.javascript.Context
import org.mozilla.javascript.ContextFactory
import org.mozilla.javascript.Function
import org.mozilla.javascript.NativeJSON
import org.mozilla.javascript.NativeJavaMethod
import org.mozilla.javascript.NativeJavaObject
import org.mozilla.javascript.Scriptable
import org.mozilla.javascript.ScriptableObject
import org.mozilla.javascript.Undefined

class JavascriptSession(private val contextFactory: ContextFactory, globals: Map<String, Any>) : Closeable, ScriptingSession {
  private val context = contextFactory.enterContext()
  private val scope: Scriptable
  private val lineNumber = AtomicInteger(0)

  init {

    // Interpreted mode, or it will produce Dalvik incompatible bytecode.
    context.optimizationLevel = -1
    scope = context.initStandardObjects()

    globals.entries.forEach { entry ->
      val (key, value) = entry
      when (value) {
        is Number, is String -> {
          ScriptableObject.putConstProperty(scope, key, value)
        }
        else -> {
          // Calling java methods in the VM produces objects wrapped in NativeJava*.
          // So passing in wrapped objects keeps them consistent.
          ScriptableObject.putConstProperty(
            scope,
            entry.key,
            NativeJavaObject(scope, value, value.javaClass))
        }
      }
    }

  }


  @Throws(JSONException::class)
  override fun evaluateCommand(userScript: String, context: Any?): JSONObject {
    val scope = context?.let { NativeJavaObject(scope, it, it.javaClass) } ?: scope
    return evaluateCommand(userScript, scope)
  }

  @Throws(JSONException::class)
  private fun evaluateCommand(command: String, scope: Scriptable): JSONObject = try {
    // This may be called by any thread, and contexts have to be entered in the current thread
    // before being used, so enter/exit every time.
    contextFactory.enterContext()
    toJson(
      context.evaluateString(
        scope,
        command,
        "stato-console",
        lineNumber.incrementAndGet(),
        null)
    )
  } finally {
    Context.exit()
  }


  @Throws(JSONException::class)
  private fun toJson(wrappedResult: Any?): JSONObject {
    @Suppress("MoveVariableDeclarationIntoWhen")
    val result = (wrappedResult as? NativeJavaObject)?.unwrap()?.run {
      this as? String ?: this as? Class<*>
    } ?: wrappedResult

    return when (result) {
      is String -> JSONObject().put(TYPE, JSON).put(VALUE, result)
      is Class<*> -> JSONObject().put(TYPE, "class").put(VALUE, result.name)
      is NativeJavaObject -> {
        val o = JSONObject()
          .put("toString", result.unwrap().toString())

        result.ids
          .filter { it is String && result.get(it, result) !is NativeJavaMethod }
          .forEach { id ->
            val name = id as String
            val value = result.get(id, result)

            val valueString = value?.run { safeUnwrap(this).toString() }
            o.put(name, valueString)

          }
        JSONObject().put(TYPE, "javaObject").put(VALUE, o)
      }

      is NativeJavaMethod -> {
        JSONObject()
          .put(TYPE, "method")
          .put("name", result.functionName)

      }

      is Function -> {
        JSONObject()
          .put(TYPE, "function")
          .put(VALUE, Context.toString(result))

      }

      is ScriptableObject -> {
        JSONObject()
          .put(TYPE, JSON)
          .put(
            VALUE,
            JSONTokener(NativeJSON.stringify(context, scope, result, null, null).toString())
              .nextValue())
      }

      is Number -> JSONObject().put(TYPE, JSON).put(VALUE, result)

      else -> JSONObject().put(TYPE, when {
        result != null -> "unknown"
        else -> "null"
      }).apply {
        if (result != null)
          put(VALUE, result.toString())
      }
    }


  }

  override fun close() {
    Context.exit()
  }

  companion object {

    private const val TYPE = "type"
    private const val VALUE = "value"
    const val JSON = "json"

    private fun safeUnwrap(o: Any): Any {
      return when (o) {
        is NativeJavaObject -> o.unwrap()
        else -> o
      }
    }
  }
}
