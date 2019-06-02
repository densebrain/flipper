package org.stato.connectivitytest

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import org.stato.android.AndroidStatoClientManager
import org.stato.core.StatoClient
import org.stato.plugins.example.ExampleStatoPlugin
import org.stato.sample.RootComponent
import com.facebook.litho.ComponentContext
import com.facebook.litho.LithoView

/**
 * Oh hai! This is probably not the kinda sample you want to copy to your application; we're just
 * using this to drive a test run and exit the app afterwards.
 */
class ConnectionTestActivity : AppCompatActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val c = ComponentContext(this)
    setContentView(LithoView.create(c, RootComponent.create(c).build()))

    AndroidStatoClientManager.client?.let { client ->

        // As we're re-using the identifier, get rid of the default plugin first.
        val exampleStatoPlugin = client.getPluginByClass(ExampleStatoPlugin::class.java)
        client.removePlugin(exampleStatoPlugin!!)

        val connectionTestPlugin = ConnectionTestPlugin(this)
        client.addPlugin(connectionTestPlugin)

    }
  }
}
