/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import {Element, ElementID, PluginClient} from "@flipper/core"
import { PersistedState } from "./index"
import { SearchResultTree } from "./Search" // $FlowFixMe

import {cloneDeep, get} from "lodash"

const propsForPersistedState = (
  AXMode: boolean
): {
  ROOT: string,
  ELEMENTS: string,
  ELEMENT: string
} => {
  return {
    ROOT: AXMode ? "rootAXElement" : "rootElement",
    ELEMENTS: AXMode ? "AXelements" : "elements",
    ELEMENT: AXMode ? "axElement" : "element"
  }
}

function constructSearchResultTree(
  node: Element,
  isMatch: boolean,
  children: Array<SearchResultTree>,
  _AXMode: boolean,
  AXNode: Element | null | undefined
): SearchResultTree {
  return {
    id: node.id,
    isMatch,
    hasChildren: children.length > 0,
    children: children.length > 0 ? children : null,
    element: node,
    axElement: AXNode
  }
}

function isMatch(element: Element, query: string): boolean {
  const nameMatch = element.name.toLowerCase().includes(query.toLowerCase())
  return nameMatch || element.id === query
}

export function searchNodes(
  node: Element | null,
  query: string,
  AXMode: boolean,
  state: PersistedState
): SearchResultTree | null | undefined {
  if (!node) return null
  
  // Even if the axMode is true, we will have to search the normal elements too.
  // The AXEelements will automatically populated in constructSearchResultTree
  const elements = get(state,propsForPersistedState(false).ELEMENTS)
  const children: Array<SearchResultTree> = []
  const match = isMatch(node, query)

  for (const childID of node.children) {
    const child = elements[childID]
    const tree = searchNodes(child, query, AXMode, state)

    if (tree) {
      children.push(tree)
    }
  }

  if (match || children.length > 0) {
    return cloneDeep(
      constructSearchResultTree(node, match, children, AXMode, AXMode ? state.AXelements[node.id] : null)
    )
  }

  return null
}

class ProxyArchiveClient implements PluginClient {
  constructor(persistedState: PersistedState) {
    this.persistedState = cloneDeep(persistedState)
  }

  persistedState: PersistedState

  subscribe<P = any>(_method: string, _callback: (params: P) => void): void {
    return
  }

  supportsMethod(_method: string): Promise<boolean> {
    return Promise.resolve(false)
  }

  send<P = any>(_method: string, _params: P): void {
    return
  }

  call<T = any, P = any>(method: string, params?: P): Promise<T> {
    const paramaters = params

    switch (method) {
      case "getRoot": {
        const { rootElement } = this.persistedState

        if (!rootElement) {
          return Promise.resolve(null)
        }

        return Promise.resolve(this.persistedState.elements[rootElement] as any)
      }

      case "getAXRoot": {
        const { rootAXElement } = this.persistedState

        if (!rootAXElement) {
          return Promise.resolve(null)
        }

        return Promise.resolve(this.persistedState.AXelements[rootAXElement] as any)
      }

      case "getNodes": {
        if (!paramaters) {
          return Promise.reject(new Error("Called getNodes with no params"))
        }

        const ids = (paramaters as any).ids as ElementID
        const arr: Array<Element> = []

        for (const id of ids) {
          arr.push(this.persistedState.elements[id])
        }

        return Promise.resolve({
          elements: arr
        } as any)
      }

      case "getAXNodes": {
        if (!paramaters) {
          return Promise.reject(new Error("Called getAXNodes with no params"))
        }
  
        const ids = (paramaters as any).ids as ElementID
        const arr: Array<Element> = []

        for (const id of ids) {
          arr.push(this.persistedState.AXelements[id])
        }

        return Promise.resolve({
          elements: arr
        } as any)
      }

      case "getSearchResults": {
        const { rootElement, rootAXElement } = this.persistedState

        if (!paramaters) {
          return Promise.reject(new Error("Called getSearchResults with no params"))
        }

        const { query, axEnabled } = paramaters as any

        if (!query) {
          return Promise.reject(new Error("query is not passed as a params to getSearchResults"))
        }

        let element: Element | null = null

        if (axEnabled) {
          if (!rootAXElement) {
            return Promise.reject(new Error("rootAXElement is undefined"))
          }

          element = this.persistedState.AXelements[rootAXElement]
        } else {
          if (!rootElement) {
            return Promise.reject(new Error("rootElement is undefined"))
          }

          element = this.persistedState.elements[rootElement]
        }

        const output = searchNodes(element, query, axEnabled, this.persistedState)
        return Promise.resolve({
          results: output,
          query
        } as any)
      }

      case "isConsoleEnabled": {
        return Promise.resolve(false as any)
      }

      default: {
        return Promise.resolve(null as any)
      }
    }
  }
  
  unsubscribe<P = any>(_method:string, _callback:(params:P) => void):void {
  }
  
  
}

export default ProxyArchiveClient
