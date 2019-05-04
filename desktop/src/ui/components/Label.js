/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import styled from '../styled/index.js';
import Text from './Text'
import {makeRootView} from './RootView'
export default makeRootView(theme => ({
  fontSize: 12,
  fontWeight: 'bold',
}),Text);
