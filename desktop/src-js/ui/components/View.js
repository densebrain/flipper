/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import {makeRootView, RootView} from './RootView';

const View = makeRootView(theme => ({
  position: 'relative',
  overflow: 'visible',
  height: 'auto',
  width: 'auto'
}),RootView, (props) => ({
  ...(props.grow ? {height: '100%', width: '100%'} : {}),
  ...(props.scrollable ? {overflow: 'auto'} : {}),
  
}));//(styleCreator(props => ,['grow','shrink','scrollable','buildItems','focused','filterKey','addFilter','justifyContent','multiline','backgroundColor']));

export default View;
