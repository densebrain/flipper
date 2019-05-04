/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import styled from '../styled/index.js';
import {styleCreator} from '../styled/index';
import {withStyles} from '../themes';
import filterProps from 'react-valid-props'
/**
 * A Text component.
 */
const Text = withStyles(({colors}) => ({
  root: {
    color: props => props.color || colors.text,
    display: 'inline',
    fontWeight: props => props.bold ? 'bold' : 'inherit',
    fontStyle: props => props.italic ? 'italic' : 'normal',
    textAlign: props => props.align || 'left',
    fontSize: props => props.size == null && props.code ? 12 : props.size,
    fontFamily: props => props.code
      ? 'SF Mono, Monaco, Andale Mono, monospace'
      : props.family,
    overflow: props => props.code ? 'auto' : 'visible',
    userSelect:
      props => props.selectable || (props.code && typeof props.selectable === 'undefined')
        ? 'text'
        : 'none',
    wordWrap: props => props.code ? 'break-word' : props.wordWrap,
    whiteSpace:
      props => props.code && typeof props.whiteSpace === 'undefined'
        ? 'pre'
        : props.whiteSpace,
  }
}))(React.forwardRef(({classes,className, style, children,...other},ref) => {
  return <span ref={ref} className={`${classes.root} ${className}`} style={style} {...filterProps(other)}>{children}</span>
}));

export default Text;
