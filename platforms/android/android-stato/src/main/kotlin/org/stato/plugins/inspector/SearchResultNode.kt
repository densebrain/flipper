/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package org.stato.plugins.inspector

import org.stato.core.StatoArray
import org.stato.core.StatoObject

class SearchResultNode internal constructor(
  private val id: String,
  private val isMatch: Boolean,
  private val element: StatoObject,
  private val children: List<SearchResultNode>?,
  private val axElement: StatoObject) {

  internal fun toStatoObject(): StatoObject {
    val childArray: StatoArray?
    if (children != null) {
      val builder = StatoArray.Builder()
      for (child in children) {
        builder.put(child.toStatoObject())
      }
      childArray = builder.build()
    } else {
      childArray = null
    }

    return StatoObject.Builder()
      .put("id", this.id)
      .put("isMatch", this.isMatch)
      .put("axElement", this.axElement)
      .put("element", this.element)
      .put("children", childArray)
      .build()
  }
}
