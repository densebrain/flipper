/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
package org.stato.android.diagnostics

import android.os.Bundle
import androidx.annotation.Nullable
import androidx.fragment.app.FragmentActivity

class StatoDiagnosticActivity : FragmentActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    supportFragmentManager
      .beginTransaction()
      .add(android.R.id.content, StatoDiagnosticFragment.newInstance())
      .commit()
  }
}
