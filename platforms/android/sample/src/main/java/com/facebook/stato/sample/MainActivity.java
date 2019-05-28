/*
 *  Copyright (c) Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package com.facebook.stato.sample;

import android.content.Intent;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import com.facebook.stato.android.AndroidStatoClient;
import com.facebook.stato.core.StatoClient;
import com.facebook.stato.plugins.example.ExampleStatoPlugin;
import com.facebook.stato.plugins.leakcanary.RecordLeakService;
import com.facebook.litho.ComponentContext;
import com.facebook.litho.LithoView;

public class MainActivity extends AppCompatActivity {

  @Override
  protected void onCreate(final Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    final ComponentContext c = new ComponentContext(this);
    setContentView(LithoView.create(c, RootComponent.create(c).build()));

    final StatoClient client = AndroidStatoClient.getInstanceIfInitialized();
    if (client != null) {
      final ExampleStatoPlugin samplePlugin = client.getPluginByClass(ExampleStatoPlugin.class);
      samplePlugin.setActivity(this);
      startService(new Intent(this, RecordLeakService.class));
    }
  }
}
