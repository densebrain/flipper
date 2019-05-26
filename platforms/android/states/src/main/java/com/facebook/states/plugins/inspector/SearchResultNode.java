/*
 *  Copyright (c) 2018-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */

package com.facebook.states.plugins.inspector;

import androidx.annotation.Nullable;
import com.facebook.states.core.StatesArray;
import com.facebook.states.core.StatesObject;
import java.util.List;

public class SearchResultNode {

  private final String id;
  private final boolean isMatch;
  private final StatesObject element;
  private final StatesObject axElement;
  @Nullable private final List<SearchResultNode> children;

  SearchResultNode(
      String id,
      boolean isMatch,
      StatesObject element,
      List<SearchResultNode> children,
      StatesObject axElement) {
    this.id = id;
    this.isMatch = isMatch;
    this.element = element;
    this.children = children;
    this.axElement = axElement;
  }

  StatesObject toStatesObject() {
    final StatesArray childArray;
    if (children != null) {
      final StatesArray.Builder builder = new StatesArray.Builder();
      for (SearchResultNode child : children) {
        builder.put(child.toStatesObject());
      }
      childArray = builder.build();
    } else {
      childArray = null;
    }

    return new StatesObject.Builder()
        .put("id", this.id)
        .put("isMatch", this.isMatch)
        .put("axElement", this.axElement)
        .put("element", this.element)
        .put("children", childArray)
        .build();
  }
}
