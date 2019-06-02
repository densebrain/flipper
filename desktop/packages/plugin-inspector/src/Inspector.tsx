/**
 * Copyright 2019-present Densebrain.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Copyright 2019-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from "react"
import {
  ElementID,
  Element,
  PluginClient,
  ElementSearchResultSet
} from "@stato/core"
import { ElementsInspector } from "@stato/core"
import { PersistedState } from "./index"
import { oc } from "ts-optchain"
type GetNodesOptions = {
  force?: boolean
  ax?: boolean
  forAccessibilityEvent?: boolean
}
type Props = {
  ax?: boolean
  client: PluginClient
  showsSidebar: boolean
  inAlignmentMode?: boolean
  selectedElement: ElementID | null | undefined
  selectedAXElement: ElementID | null | undefined
  onSelect: (ids: ElementID | null | undefined) => void
  onDataValueChanged: (path: Array<string>, value: any) => void
  setPersistedState: (state: Partial<PersistedState>) => void
  persistedState: PersistedState
  searchResults: ElementSearchResultSet | null | undefined
}
export default class Inspector extends React.Component<Props> {
  call() {
    return {
      GET_ROOT: this.props.ax ? "getAXRoot" : "getRoot",
      INVALIDATE: this.props.ax ? "invalidateAX" : "invalidate",
      GET_NODES: this.props.ax ? "getAXNodes" : "getNodes",
      SET_HIGHLIGHTED: "setHighlighted",
      SELECT: this.props.ax ? "selectAX" : "select"
    }
  }

  selected = () => {
    return this.props.ax
      ? this.props.selectedAXElement
      : this.props.selectedElement
  }
  root = () => {
    return this.props.ax
      ? this.props.persistedState.rootAXElement
      : this.props.persistedState.rootElement
  }
  elements = () => {
    return this.props.ax
      ? this.props.persistedState.AXelements
      : this.props.persistedState.elements
  }

  componentDidMount() {
    this.props.client.call(this.call().GET_ROOT).then((root: Element) => {
      this.props.setPersistedState({
        [this.props.ax ? "rootAXElement" : "rootElement"]: root.id
      })
      this.updateElement(root.id, { ...root, expanded: true })
      this.performInitialExpand(root)
    })
    this.props.client.subscribe(
      this.call().INVALIDATE,
      ({
        nodes
      }: {
        nodes: Array<{
          id: ElementID
          children: Array<ElementID>
        }>
      }) => {
        this.getNodes(
          nodes
            .map(n => [n.id, ...(n.children || [])])
            .reduce((acc, cv) => acc.concat(cv), []),
          {}
        )
      }
    )
    this.props.client.subscribe(
      this.call().SELECT,
      ({ path }: { path: Array<ElementID> }) => {
        this.getAndExpandPath(path)
      }
    )
  }

  componentDidUpdate(prevProps: Props) {
    const { ax, selectedElement, selectedAXElement } = this.props

    if (
      ax &&
      selectedElement !== prevProps.selectedElement &&
      selectedElement
    ) {
      // selected element changed, find linked AX element
      const linkedAXNode = oc(
        this.props.persistedState.elements[selectedElement]
      ).extraInfo.linkedAXNode(null)

      this.props.onSelect(linkedAXNode)
    } else if (
      !ax &&
      selectedAXElement !== prevProps.selectedAXElement &&
      selectedAXElement
    ) {
      // selected AX element changed, find linked element
      const linkedNode: Element | null | undefined = Object.values(
        this.props.persistedState.elements // $FlowFixMe it's an Element not mixed
      ).find(
        (e: Element) => oc(e.extraInfo).linkedAXNode(null) === selectedAXElement
      )
      this.props.onSelect(oc(linkedNode).id(""))
    }
  }

  updateElement(id: ElementID, data: Record<string, any>) {
    this.props.setPersistedState({
      [this.props.ax ? "AXelements" : "elements"]: {
        ...this.elements(),
        [id]: { ...this.elements()[id], ...data }
      }
    })
  } // When opening the inspector for the first time, expand all elements that
  // contain only 1 child recursively.

  async performInitialExpand(element: Element): Promise<void> {
    if (!element.children.length) {
      // element has no children so we're as deep as we can be
      return
    }

    return this.getChildren(element.id, {}).then(
      (_elements: Array<Element>) => {
        return element.children.length >= 2
          ? null
          : this.performInitialExpand(this.elements()[element.children[0]])
      }
    )
  }

  async getChildren(
    id: ElementID,
    options: GetNodesOptions
  ): Promise<Array<Element>> {
    if (!this.elements()[id]) {
      await this.getNodes([id], options)
    }

    this.updateElement(id, {
      expanded: true
    })
    return this.getNodes(this.elements()[id].children, options)
  }

  getNodes(
    ids: Array<ElementID> = [],
    options: GetNodesOptions
  ): Promise<Array<Element>> {
    const { forAccessibilityEvent } = options

    if (ids.length > 0) {
      return this.props.client
        .call<{ elements: Array<Element> }>(this.call().GET_NODES, {
          ids,
          forAccessibilityEvent,
          selected: false
        })
        .then(({ elements }) => {
          elements.forEach(e => this.updateElement(e.id, e))
          return elements
        })
    } else {
      return Promise.resolve([])
    }
  }

  getAndExpandPath(path: Array<ElementID>) {
    return Promise.all(path.map(id => this.getChildren(id, {}))).then(() => {
      this.onElementSelected(path[path.length - 1])
    })
  }

  //debounce(
  onElementSelected = async (selectedKey: ElementID) => {
    await this.onElementHovered(selectedKey)
    this.props.onSelect(selectedKey)
  }
  onElementHovered = (key: ElementID | null | undefined) =>
    this.props.client.call(this.call().SET_HIGHLIGHTED, {
      id: key,
      isAlignmentMode: this.props.inAlignmentMode
    })

  onElementExpanded = (id: ElementID, deep: boolean) => {
    const expanded = !this.elements()[id].expanded
    this.updateElement(id, {
      expanded
    })

    if (expanded) {
      this.getChildren(id, {}).then(children => {
        if (deep) {
          children.forEach(child => this.onElementExpanded(child.id, deep))
        }
      })
    }
  }

  render() {
    return this.root() ? (
      <ElementsInspector
        onElementSelected={this.onElementSelected}
        onElementHovered={this.onElementHovered}
        onElementExpanded={this.onElementExpanded}
        onValueChanged={this.props.onDataValueChanged}
        searchResults={this.props.searchResults}
        selected={this.selected()}
        root={this.root()}
        elements={this.elements()}
      />
    ) : null
  }
}
