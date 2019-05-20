/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
export { default, styleCreator } from "./styled"
export * from "./StyledCustom"
export * from "./StyleTypes"
export * from "./prebuilt-styles"
export { lighten, darken } from "@material-ui/core/styles/colorManipulator"

import {create} from "jss"

import * as FlexStyles from "./flex-styles"
export * from "./prebuilt-styles"


//import { create } from "jss"


const jssPreset = require("@material-ui/styles/jssPreset").default // Default JSS instance.

export const jss = create(jssPreset() as any) //export {default as jss} from 'jss'

export {
  FlexStyles
}


