/*
 *  Copyright (c) Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.states.sample;

import android.content.Intent;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import com.facebook.states.android.AndroidStatesClient;
import com.facebook.states.core.StatesClient;
import com.facebook.states.plugins.example.ExampleStatesPlugin;
import com.facebook.states.plugins.leakcanary.RecordLeakService;
import com.facebook.litho.ComponentContext;
import com.facebook.litho.LithoView;

public class MainActivity extends AppCompatActivity {

  @Override
  protected void onCreate(final Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    final ComponentContext c = new ComponentContext(this);
    setContentView(LithoView.create(c, RootComponent.create(c).build()));

    final StatesClient client = AndroidStatesClient.getInstanceIfInitialized();
    if (client != null) {
      final ExampleStatesPlugin samplePlugin = client.getPluginByClass(ExampleStatesPlugin.class);
      samplePlugin.setActivity(this);
      startService(new Intent(this, RecordLeakService.class));
    }
  }
}
