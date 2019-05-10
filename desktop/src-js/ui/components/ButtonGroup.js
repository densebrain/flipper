/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import styled from '../styled/index.js';
import {Component} from 'react';

const PropTypes = require('prop-types');

const ButtonGroupContainer = styled('div')({
  display: 'inline-flex',
  marginLeft: 10,
  '&:first-child': {
    marginLeft: 0,
  },
});

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
  children: React.ReactNode,
}> {
  getChildContext() {
    return {inButtonGroup: true};
  }

  render() {
    return <ButtonGroupContainer>{this.props.children}</ButtonGroupContainer>;
  }
}

ButtonGroup.childContextTypes = {
  inButtonGroup: PropTypes.bool,
};
