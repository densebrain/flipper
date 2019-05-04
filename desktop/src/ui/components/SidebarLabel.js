/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import Label from './Label.js';
import {makeRootView} from './RootView'
export default makeRootView(theme => ({
  color: theme.colors.text,
  fontSize: 12,
  padding: 10,
}),Label);
