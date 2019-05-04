/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import FlexBox from './FlexBox.js';
import styled from '../styled/index.js';
import {makeRootView} from './RootView';

/**
 * A container displaying its children in a column
 */
export default makeRootView(theme => ({
  flexDirection: 'column',
}),FlexBox);
