/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from "react"
import {isDefined, isString} from "typeguard"


function isReactElement(object: any) {
  return typeof object === "object" && object !== null && object.$$typeof === Symbol.for("react.element")
}
/**
 * Recursively walks through all children of a React element and returns
 * the string representation of the leafs concatenated.
 */

export default (node: React.ReactNode | Node | boolean | string | number | null | undefined): string => {
  if (!React.isValidElement(node)) return isString(node) ? node : isDefined(node) ? String(node) : ""
  
  let res = ""

  const traverse = (node: React.ReactElement) => {
    if (typeof node === "string" || typeof node === "number") {
      // this is a leaf, add it to the result string
      res += node
    } else if (Array.isArray(node)) {
      // traverse all array members and recursively stringify them
      node.forEach(traverse)
    } else if (isReactElement(node)) {
      // node is a react element access its children an recursively stringify them
      // $FlowFixMe
      const { children } = node.props

      if (Array.isArray(children)) {
        children.forEach(traverse)
      } else {
        traverse(children)
      }
    }
  }

  traverse(node)
  return res
}
