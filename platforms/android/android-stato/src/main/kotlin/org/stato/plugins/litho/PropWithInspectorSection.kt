/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
package org.stato.plugins.litho

import java.util.AbstractMap

interface PropWithInspectorSection {

  val statoLayoutInspectorSection: AbstractMap.SimpleEntry<String, String>
}
