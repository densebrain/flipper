/*
 *  Copyright (c) Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.sample

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.facebook.litho.ComponentContext
import com.facebook.litho.LithoView
import org.stato.android.AndroidStatoClientManager
import org.stato.core.getPlugin
import org.stato.plugins.example.ExampleStatoPlugin
import org.stato.plugins.leakcanary.RecordLeakService

class MainActivity : AppCompatActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val c = ComponentContext(this)
    setContentView(LithoView.create(c, RootComponent.create(c).build()))

    AndroidStatoClientManager.client?.let { client ->

      val samplePlugin = client.getPlugin<ExampleStatoPlugin>()
      samplePlugin!!.setActivity(this)
      startService(Intent(this, RecordLeakService::class.java))
    }
  }
}
