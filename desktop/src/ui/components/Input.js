/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import styled from '../styled/index.js';
import {colors} from '../themes/colors.js';
import type {Theme} from '../themes';
import {lighten} from '@material-ui/core/styles/colorManipulator';
import {Transparent} from '../styled/index';

export const inputStyle = (theme: Theme, compact: boolean) => {
  const {colors} = theme;
  return ({
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.backgroundInput,
    color: colors.textInput,
    borderRadius: 4,
    font: 'inherit',
    fontSize: '1em',
    height: compact ? '17px' : '28px',
    lineHeight: compact ? '17px' : '28px',
    marginRight: 5,
    
    '&:disabled': {
      backgroundColor: lighten(colors.backgroundInput,0.2),
      borderColor: Transparent,
      cursor: 'not-allowed',
    },
  });
};

const Input = styled('input')(({compact, theme}) => ({
  ...inputStyle(theme, compact),
  padding: compact ? '0 5px' : '0 10px',
}));

Input.defaultProps = {
  type: 'text',
};

export default Input;
