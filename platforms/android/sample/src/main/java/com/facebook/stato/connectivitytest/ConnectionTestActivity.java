package com.facebook.stato.connectivitytest;

import android.os.Bundle;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import com.facebook.stato.android.AndroidStatoClient;
import com.facebook.stato.core.StatoClient;
import com.facebook.stato.plugins.example.ExampleStatoPlugin;
import com.facebook.stato.sample.RootComponent;
import com.facebook.litho.ComponentContext;
import com.facebook.litho.LithoView;

/**
 * Oh hai! This is probably not the kinda sample you want to copy to your application; we're just
 * using this to drive a test run and exit the app afterwards.
 */
public class ConnectionTestActivity extends AppCompatActivity {

  @Override
  protected void onCreate(@Nullable Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    final ComponentContext c = new ComponentContext(this);
    setContentView(LithoView.create(c, RootComponent.create(c).build()));

    final StatoClient client = AndroidStatoClient.getInstanceIfInitialized();
    if (client != null) {
      // As we're re-using the identifier, get rid of the default plugin first.
      final ExampleStatoPlugin exampleStatoPlugin =
          client.getPluginByClass(ExampleStatoPlugin.class);
      client.removePlugin(exampleStatoPlugin);

      final ConnectionTestPlugin connectionTestPlugin = new ConnectionTestPlugin(this);
      client.addPlugin(connectionTestPlugin);
    }
  }
}
