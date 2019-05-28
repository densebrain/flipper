/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package com.facebook.stato.plugins.inspector;

import androidx.annotation.Nullable;
import com.facebook.stato.core.StatoArray;
import com.facebook.stato.core.StatoObject;
import java.util.List;

public class SearchResultNode {

  private final String id;
  private final boolean isMatch;
  private final StatoObject element;
  private final StatoObject axElement;
  @Nullable private final List<SearchResultNode> children;

  SearchResultNode(
      String id,
      boolean isMatch,
      StatoObject element,
      List<SearchResultNode> children,
      StatoObject axElement) {
    this.id = id;
    this.isMatch = isMatch;
    this.element = element;
    this.children = children;
    this.axElement = axElement;
  }

  StatoObject toStatoObject() {
    final StatoArray childArray;
    if (children != null) {
      final StatoArray.Builder builder = new StatoArray.Builder();
      for (SearchResultNode child : children) {
        builder.put(child.toStatoObject());
      }
      childArray = builder.build();
    } else {
      childArray = null;
    }

    return new StatoObject.Builder()
        .put("id", this.id)
        .put("isMatch", this.isMatch)
        .put("axElement", this.axElement)
        .put("element", this.element)
        .put("children", childArray)
        .build();
  }
}
