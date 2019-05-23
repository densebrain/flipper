/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from 'react';
import Glyph, {GlyphProps} from './Glyph'
import PropTypes from 'prop-types';
import * as Electron from 'electron';
import {PopupOptions} from 'electron'
import styled from '../styled/index';
import { connect } from 'react-redux';
import { findDOMNode } from 'react-dom';
import { keyframes } from '@emotion/core';
import { alpha, styleCreator } from '../styled';
import { withTheme,ThemeProps } from '../themes';
import { makeTransition } from '../styled/index';
import { lighten } from '@material-ui/core/styles/colorManipulator';
import {RootState} from "../../reducers"


const borderColor = (props:Props, hover = false) => {
  const {
    theme
  } = props,
        {
    colors
  } = theme;

  if (hover) {
    return colors.backgroundSelected;
  } else if (!props.windowIsFocused) {
    return colors.border;
  } else if (props.type === 'danger') {
    return colors.error;
  } else if (props.type === 'primary') {
    return colors.backgroundSelected;
  } else if (props.depressed) {
    return colors.border;
  } else {
    return colors.border;
  }
};

const borderBottomColor = (props: Props) => {
  const {
    theme
  } = props,
        {
    colors
  } = theme;

  if (!props.windowIsFocused) {
    return colors.border;
  } else if (props.type === 'danger') {
    return colors.error;
  } else if (props.type === 'primary') {
    return colors.backgroundSelected;
  } else {
    return colors.border;
  }
};

const backgroundImage = (props:Props, hover = false) => {
  const {
    theme
  } = props,
        {
    colors
  } = theme;

  if (props.windowIsFocused) {
    if (hover) {
      return `linear-gradient(to bottom, ${colors.backgroundSelected} 1px, ${colors.backgroundSelected} 0%, ${lighten(colors.backgroundSelected, 0.1)} 100%)`;
    } else if (props.depressed) {
      return `linear-gradient(to bottom, ${colors.border} 1px, ${alpha(colors.border, 0.8)} 0%, ${colors.background} 100%)`;
    } else if (props.type === 'primary') {
      return `linear-gradient(to bottom, ${colors.backgroundSelected} 0%, ${alpha(colors.backgroundSelected, 0.8)} 100%)`;
    } else {
      return `linear-gradient(to bottom, transparent 0%,${colors.background} 100%)`;
    }
  } else {
    return 'none';
  }
};

const color = (props: Props) => {
  const {
    theme
  } = props,
        {
    colors
  } = theme;

  if (props.type === 'danger' && props.windowIsFocused) {
    return colors.error;
  } else if (props.type === 'primary' && props.windowIsFocused) {
    return colors.backgroundSelected;
  } else if (props.disabled) {
    return colors.textLight;
  } else if (props.depressed) {
    return colors.textDepressed;
  } else {
    return colors.textLight;
  }
};

const pulse = ({
  theme
}:Props) => keyframes({
  '0%': {
    boxShadow: `0 0 4px 0 ${theme.colors.backgroundSelected}`
  },
  '70%': {
    boxShadow: '0 0 4px 6px transparent'
  },
  '100%': {
    boxShadow: '0 0 4px 0 transparent'
  }
});

const StyledButton = styled('div')(styleCreator<Props>((props: Props) => {
  const {
    theme
  } = props,
        {
    colors
  } = theme;
  return { ...makeTransition(['backgroundColor', 'backgroundImage', 'background', 'border', "borderColor"]),
    backgroundColor: !props.windowIsFocused ? colors.background : alpha(colors.background, 0.8),
    backgroundImage: backgroundImage(props),
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: borderColor(props),
    borderBottomColor: borderBottomColor(props),
    color: color(props),
    borderRadius: 4,
    position: 'relative',
    padding: props.padded ? '0 15px' : '0 6px',
    height: props.compact === true ? 24 : 28,
    margin: 0,
    marginLeft: props.inButtonGroup === true ? 0 : 10,
    minWidth: 34,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: props.pulse && props.windowIsFocused ? `0 0 0 ${colors.backgroundSelected}` : '',
    animation: props.pulse && props.windowIsFocused ? `${pulse(props)} 1s infinite` : '',
    '&:not(:first-child)': {
      borderTopLeftRadius: props.inButtonGroup === true ? 0 : 4,
      borderBottomLeftRadius: props.inButtonGroup === true ? 0 : 4
    },
    '&:not(:last-child)': {
      borderTopRightRadius: props.inButtonGroup === true ? 0 : 4,
      borderBottomRightRadius: props.inButtonGroup === true ? 0 : 4,
      borderRight: props.inButtonGroup === true ? 0 : ''
    },
    '&:first-of-type': {
      marginLeft: 0
    },
    '&:active': {
      borderColor: colors.border,
      borderBottomColor: colors.border,
      background: `linear-gradient(to bottom, ${colors.backgroundSelected} 1px, ${colors.backgroundSelected} 0%, ${lighten(colors.backgroundSelected, 0.2)} 100%)`
    },
    '&:disabled': {
      borderColor: borderColor(props),
      borderBottomColor: borderBottomColor(props),
      pointerEvents: 'none'
    },
    '&:hover': {
      //backgroundImage: backgroundImage(props,true)
      borderColor: borderColor(props, true)
    },
    '&:hover::before': {
      content: props.dropdown ? '\'\'' : 'normal',
      position: 'absolute',
      bottom: 1,
      right: 2,
      borderStyle: 'solid',
      borderWidth: '4px 3px 0 3px',
      borderColor: `${colors.backgroundStatus} transparent transparent transparent`
    }
  };
}, ['pulse', 'compact', 'icon', 'title', 'windowIsFocused', 'inButtonGroup', 'dispatch']));

type IconProps = {hasText?: boolean} & GlyphProps

const Icon = styled(Glyph)(styleCreator<IconProps>(({
  hasText
}:IconProps) => ({
  marginRight: hasText ? 3 : 0
}), ['hasText']));

type StateProps = {
  windowIsFocused?: boolean
}

type OwnProps = {
  onClick?: (event: React.MouseEvent) => any;
  disabled?: boolean;
  large?: boolean;
  compact?: boolean;
  type?: "primary" | "success" | "warning" | "danger";
  children?: React.ReactNode;
  dropdown?: Array<Electron.MenuItemConstructorOptions>;
  icon?: string;
  iconSize?: number;
  selected?: boolean;
  pulse?: boolean;
  href?: string;
  depressed?: boolean;
  iconVariant?: "filled" | "outline";
  padded?: boolean;
  inButtonGroup?: boolean
}

type Props = ThemeProps<StateProps & OwnProps, string,true>;
type State = {
  active: boolean;
};
/**
 * A simple button, used in many parts of the application.
 */


const Button = withTheme()(class Button extends React.Component<Props, State> {
  static contextTypes = {
    inButtonGroup: PropTypes.bool
  };
  state = {
    active: false
  };
  
  ref = React.createRef<HTMLButtonElement>();
  
  onMouseDown = () => this.setState({
    active: true
  });
  onMouseUp = () => this.setState({
    active: false
  });
  onClick = (e: React.MouseEvent) => {
    const
      {dropdown, onClick, href, disabled} = this.props
    if (disabled === true) {
      return;
    }

    if (dropdown) {
      
      const  menu = Electron.remote.Menu.buildFromTemplate(dropdown);
      const position = {} as Partial<PopupOptions>
      const {
        current
      } = this.ref;

      if (current) {
        const node = findDOMNode(current);

        if (node instanceof Element) {
          const {
            left,
            bottom
          } = node.getBoundingClientRect();
          position.x = left;
          position.y = bottom + 6;
        }
      }

      menu.popup({
        //window: Electron.remote.getCurrentWindow(),
        //...position
      });
    }

    if (onClick) {
      onClick(e);
    }

    if (href) {
      Electron.shell.openExternal(href);
    }
  };

  render() {
    const {
      icon,
      children,
      selected,
      iconSize,
      windowIsFocused,
      iconVariant,
      theme,
      disabled,
      ...props
    } = this.props;
    const {
      active
    } = this.state,
          {
      colors
    } = theme;
    let color = colors.text;

    if (disabled === true) {
      color = colors.textBlur;
    } else if (windowIsFocused && selected === true) {
      color = colors.textDepressed;
    } else if (!windowIsFocused && (selected == null || selected === false)) {
      color = colors.text;
    } else if (!windowIsFocused && selected === true) {
      color = colors.textDepressed;
    } else if (selected == null && active) {
      color = colors.text;
    } else if (props.type === 'danger') {
      color = colors.error;
    }

    let iconComponent;

    if (icon != null) {
      iconComponent = <Icon name={icon} size={iconSize || (this.props.compact === true ? 12 : 16)} color={color} variant={iconVariant || 'filled'} hasText={Boolean(children)} />;
    }

    return <StyledButton {...props} ref={this.ref} windowIsFocused={windowIsFocused} onClick={this.onClick} onMouseDown={this.onMouseDown} onMouseUp={this.onMouseUp} inButtonGroup={this.context.inButtonGroup}>
        {iconComponent}
        {children}
      </StyledButton>;
  }

})

export default connect<StateProps,{},OwnProps, RootState>(({
  application: {
    windowIsFocused
  }
}) => ({
  windowIsFocused
}))(Button); // $FlowFixMe

// (ConnectedButton as StyledComponent<Props>);
