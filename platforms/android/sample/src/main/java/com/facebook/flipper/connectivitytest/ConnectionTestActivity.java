package com.facebook.states.connectivitytest;

import android.os.Bundle;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import com.facebook.states.android.AndroidStatesClient;
import com.facebook.states.core.StatesClient;
import com.facebook.states.plugins.example.ExampleStatesPlugin;
import com.facebook.states.sample.RootComponent;
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

    final StatesClient client = AndroidStatesClient.getInstanceIfInitialized();
    if (client != null) {
      // As we're re-using the identifier, get rid of the default plugin first.
      final ExampleStatesPlugin exampleStatesPlugin =
          client.getPluginByClass(ExampleStatesPlugin.class);
      client.removePlugin(exampleStatesPlugin);

      final ConnectionTestPlugin connectionTestPlugin = new ConnectionTestPlugin(this);
      client.addPlugin(connectionTestPlugin);
    }
  }
}
