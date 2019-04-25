/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import styled from '../styled/index.js';
import {styleCreator} from '../styled/index';

const View = styled('div')(styleCreator(props => ({
  height: props.grow ? '100%' : 'auto',
  overflow: props.scrollable ? 'auto' : 'visible',
  position: 'relative',
  width: props.grow ? '100%' : 'auto',
}),['grow','shrink','scrollable','buildItems','focused','filterKey','addFilter','justifyContent','multiline','backgroundColor']));

export default View;
