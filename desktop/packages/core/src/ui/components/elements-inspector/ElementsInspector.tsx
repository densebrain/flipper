/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from "react"
import FlexRow from "../FlexRow"
import {ContextMenuExtension, Elements} from "./elements"
export type ElementID = string
export type ElementSearchResultSet = {
  query: string,
  matches: Set<ElementID>
}
export type ElementData = {
  [name in ElementID]: {
    [key: string]:
      | string
      | number
      | boolean
      | {
          __type__: string,
          value: any
        }
      | {}
  }
}
export type ElementAttribute = {
  name: string,
  value: string
}
export type ElementExtraInfo = {
  nonAXWithAXChild?: boolean,
  linkedAXNode?: string,
  focused?: boolean
}
export type Element = {
  id: ElementID,
  name: string,
  expanded: boolean,
  children: Array<ElementID>,
  attributes: Array<ElementAttribute>,
  data: ElementData,
  decoration: string,
  extraInfo: ElementExtraInfo
}
export default class ElementsInspector extends React.Component<{
  onElementExpanded: (key: ElementID, deep: boolean) => void,
  onElementSelected: (key: ElementID) => void,
  onElementHovered: (key: ElementID | null | undefined) => void | null | undefined,
  onValueChanged: (path: Array<string>, val: any) => void | null | undefined,
  selected: ElementID | null | undefined,
  focused?: ElementID | null | undefined,
  searchResults?: ElementSearchResultSet | null | undefined,
  root: ElementID | null | undefined,
  elements: {
    [key in ElementID]: Element
  },
  useAppSidebar?: boolean,
  alternateRowColor?: boolean,
  contextMenuExtensions?: Array<ContextMenuExtension>
}> {
  static defaultProps = {
    alternateRowColor: true
  }

  render() {
    const {
      selected,
      focused,
      elements,
      root,
      onElementExpanded,
      onElementSelected,
      onElementHovered,
      searchResults,
      alternateRowColor,
      contextMenuExtensions
    } = this.props
    return (
      <FlexRow grow={true}>
        <Elements
          onElementExpanded={onElementExpanded}
          onElementSelected={onElementSelected}
          onElementHovered={onElementHovered}
          selected={selected}
          focused={focused}
          searchResults={searchResults}
          root={root}
          elements={elements}
          alternateRowColor={alternateRowColor}
          contextMenuExtensions={contextMenuExtensions}
        />
      </FlexRow>
    )
  }
}
