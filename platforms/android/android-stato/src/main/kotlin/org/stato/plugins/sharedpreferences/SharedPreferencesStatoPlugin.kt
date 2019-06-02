/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package org.stato.plugins.sharedpreferences

import android.content.Context.MODE_PRIVATE

import android.content.Context
import android.content.SharedPreferences
import org.stato.core.StatoPluginConnection
import org.stato.core.StatoObject
import org.stato.core.StatoPlugin
import org.stato.core.StatoResponder
import java.io.File

class SharedPreferencesStatoPlugin(
  context: Context,
  descriptors: List<SharedPreferencesDescriptor> = buildDescriptorForAllPrefsFiles(context)
) : StatoPlugin {
  private var connection: StatoPluginConnection? = null
  private val sharedPreferencesMap = mutableMapOf<SharedPreferences, SharedPreferencesDescriptor>()
  private val onSharedPreferenceChangeListener =
    SharedPreferences.OnSharedPreferenceChangeListener { sharedPreferences: SharedPreferences, key: String ->
      //override fun onSharedPreferenceChanged() {
      if (connection == null) {
        return@OnSharedPreferenceChangeListener
      }
      val descriptor = sharedPreferencesMap[sharedPreferences]
        ?: return@OnSharedPreferenceChangeListener
      connection!!.send(
        "sharedPreferencesChange",
        StatoObject.Builder()
          .put("preferences", descriptor.name)
          .put("name", key)
          .put("deleted", !sharedPreferences.contains(key))
          .put("time", System.currentTimeMillis())
          .put("value", sharedPreferences.all[key])
          .build())
    }


  override val id = "Preferences"

  /**
   * Creates a [android.content.SharedPreferences] plugin for Stato
   *
   * @param context The context to retrieve the file from.
   * @param name The preference file name.
   * @param mode The Context mode to utilize.
   */
  init {
    descriptors.forEach { value ->
      val prefs = context.getSharedPreferences(value.name, value.mode)
        ?: error("Unable to get prefs for ${value.name}")
      prefs.registerOnSharedPreferenceChangeListener(onSharedPreferenceChangeListener)
      sharedPreferencesMap[prefs] = value

    }
  }

  /**
   * Creates a [android.content.SharedPreferences] plugin for Stato
   *
   * @param context The context to retrieve the preferences from.
   * @param descriptors A list of [SharedPreferencesDescriptor]s that describe the list of
   * preferences to retrieve.
   */


  private fun getSharedPreferencesFor(name: String?): SharedPreferences {
    return sharedPreferencesMap.entries
      .find { (_, desc) -> desc.name == name }
      ?.let { it.key }
      ?: error("Unknown shared preferences ${name}")


  }

  private fun getStatoObjectFor(name: String?): StatoObject {
    return getStatoObjectFor(getSharedPreferencesFor(name))
  }

  private fun getStatoObjectFor(sharedPreferences: SharedPreferences): StatoObject {

    return sharedPreferences.all.entries.fold(StatoObject.Builder()) { builder, (key, value): Map.Entry<String, Any?> ->
      builder.put(key, value)
    }.build()
//    for (entry in map.entrySet()) {
//      val `val` = entry.getValue()
//      builder.put(entry.getKey(), `val`)
//    }
//    return builder.build()
  }

  override fun onConnect(connection: StatoPluginConnection) {
    this.connection = connection

    connection.receive(
      "getAllSharedPreferences") { params: StatoObject, responder: StatoResponder ->
      responder.success(sharedPreferencesMap.entries.fold(StatoObject.Builder()) { builder, (prefs, desc) ->
        builder.put(desc.name, prefs)
      }.build())
//          for (entry in sharedPreferences.entrySet()) {
//            builder.put(entry.getValue().name, getStatoObjectFor(entry.getKey()))
//          }
//          responder.success(builder.build())

    }

    connection.receive(
      "getSharedPreferences") { params: StatoObject, responder: StatoResponder ->

      responder.success(params.getString("name")?.let { getStatoObjectFor(it) } ?: return@receive)


    }


    connection.receive(
      "setSharedPreference") { params: StatoObject, responder: StatoResponder ->
      val sharedPreferencesName = params.getString("sharedPreferencesName")
      val preferenceName = params.getString("preferenceName")
      val sharedPrefs = getSharedPreferencesFor(sharedPreferencesName)
      val originalValue = sharedPrefs.getAll().get(preferenceName)
      val editor = sharedPrefs.edit()

      when (originalValue) {
        is Boolean -> editor.putBoolean(preferenceName, params.getBoolean("preferenceValue"))
        is Long -> editor.putLong(preferenceName, params.getLong("preferenceValue"))
        is Int -> editor.putInt(preferenceName, params.getInt("preferenceValue"))
        is Float -> editor.putFloat(preferenceName, params.getFloat("preferenceValue").toFloat())
        is String -> editor.putString(preferenceName, params.getString("preferenceValue"))
        else -> throw IllegalArgumentException("Type not supported: $preferenceName")
      }

      editor.apply()

      responder.success(getStatoObjectFor(sharedPreferencesName))
    }

  }

  override fun onDisconnect() {
    connection = null
  }

  override fun runInBackground(): Boolean {
    return false
  }

  data class SharedPreferencesDescriptor(val name: String, val mode: Int) {
    init {
      if (name.isBlank()) {
        throw IllegalArgumentException("Given null or empty name")
      }
    }
  }

  companion object {

    private const val SHARED_PREFS_DIR = "@stato/plugin-shared-preferences"
    private const val XML_SUFFIX = ".xml"

    private fun buildDescriptorForAllPrefsFiles(context: Context): List<SharedPreferencesDescriptor> {
      return File(context.applicationInfo.dataDir, SHARED_PREFS_DIR)
        .list { _, name -> name.endsWith(XML_SUFFIX) }
        .map {
          SharedPreferencesDescriptor(it.substring(0, it.indexOf(XML_SUFFIX)), MODE_PRIVATE)
        }

    }
  }
}
