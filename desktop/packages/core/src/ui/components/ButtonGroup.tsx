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
import styled from "../styled/index"
import { Component } from "react"
import { FlexRowCenter } from "../styled/flex-styles"

const PropTypes = require("prop-types")

const ButtonGroupContainer = styled("div")({
  ...FlexRowCenter,
  marginLeft: 10,
  "&:first-child": {
    marginLeft: 0
  }
})
/**
 * Group a series of buttons together.
 *
 * ```jsx
 *   <ButtonGroup>
 *     <Button>One</Button>
 *     <Button>Two</Button>
 *     <Button>Three</Button>
 *   </ButtonGroup>
 * ```
 */

export default class ButtonGroup extends Component<{
  children: React.ReactNode
}> {
  static childContextTypes = {
    inButtonGroup: PropTypes.bool
  }

  getChildContext() {
    return {
      inButtonGroup: true
    }
  }

  render() {
    return <ButtonGroupContainer>{this.props.children}</ButtonGroupContainer>
  }
}
