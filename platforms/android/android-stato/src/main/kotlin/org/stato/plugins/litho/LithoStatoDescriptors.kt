/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package org.stato.plugins.litho

import org.stato.plugins.inspector.DescriptorMapping
import com.facebook.litho.DebugComponent
import com.facebook.litho.LithoView
import com.facebook.litho.sections.debug.DebugSection
import com.facebook.litho.widget.LithoRecylerView

object LithoStatoDescriptors {

  fun add(descriptorMapping: DescriptorMapping) {
    descriptorMapping.register(LithoView::class.java, LithoViewDescriptor())
    descriptorMapping.register(DebugComponent::class.java, DebugComponentDescriptor())
  }

  fun addWithSections(descriptorMapping: DescriptorMapping) {
    add(descriptorMapping)
    descriptorMapping.register(LithoRecylerView::class.java, LithoRecyclerViewDescriptor())
    descriptorMapping.register(DebugSection::class.java, DebugSectionDescriptor())
  }
}
