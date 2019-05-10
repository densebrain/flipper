/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import React from 'react';
import styled from '../styled/index.js';
import FlexColumn from './FlexColumn.js';
import FlexBox from './FlexBox.js';
//import {colors} from '../themes/colors.js';
import Glyph from './Glyph.js';
import {styleCreator} from '../styled/index';
import type {Theme} from '../themes/themes';
import {rem} from '../styled';
import withStyles, {StyleRulesCallback} from '@material-ui/styles/withStyles';
import Text from './Text';

function panelBorder(theme: Theme): string {
  const colors = theme.colors;
  return `${rem(0.1)} solid ${colors.border}`;
}

const Chevron = styled(Glyph)({
  marginRight: 4,
  marginLeft: -2,
  marginBottom: 1,
});

type Classes = 'root'

function baseStyles(theme): StyleRulesCallback<Classes> {
  return {
    root: {},
    
  };
}


/**
 * A Panel component.
 */
@withStyles(baseStyles, {withTheme: true})
export default class Panel extends React.Component<{|
  /**
   * Class name to customise styling.
   */
  className?: string,
  /**
   * Whether this panel is floating from the rest of the UI. ie. if it has
   * margin and a border.
   */
  floating?: boolean,
  
  /**
   * Theme property injected by withStyles
   */
  theme?: Theme,
  
  /**
   * Whether the panel takes up all the space it can. Equivalent to the following CSS:
   *
   *  height: 100%;
   *  width: 100%;
   */
  grow?: boolean,
  /**
   * Heading for this panel. If this is anything other than a string then no
   * padding is applied to the heading.
   */
  heading: React.ReactNode,
  /**
   * Contents of the panel.
   */
  children?: React.ReactNode,
  /**
   * Whether the panel header and body have padding.
   */
  padded?: boolean,
  /**
   * Whether the panel can be collapsed. Defaults to true
   */
  collapsable: boolean,
  /**
   * Initial state for panel if it is collapsable
   */
  collapsed?: boolean,
  /**
   * Heading for this panel. If this is anything other than a string then no
   * padding is applied to the heading.
   */
  accessory?: React.ReactNode,
|},
  {
    collapsed: boolean,
  },
  > {
  static defaultProps: {|
    floating: boolean,
    grow: boolean,
    collapsable: boolean,
    collapsed: boolean
  |} = {
    grow: false,
    floating: true,
    collapsable: true,
    collapsed: false,
  };
  
  
  static PanelContainer = styled(FlexColumn, 'PanelContainer')(styleCreator(({theme, floating, collapsed}) => ({
    ...theme.panel.container,
    flexShrink: 0,
    padding: floating ? 10 : 0,
    borderBottom: collapsed ? 'none' : panelBorder(theme),
  }), ['floating', 'padded', 'collapsed']));
  
  static PanelHeader = styled(FlexBox, 'PanelHeader')(styleCreator(({theme, floating, padded}) => ({
    ...theme.panel.header,
    backgroundColor: theme.colors.background,
    border: floating ? panelBorder(theme) : 'none',
    borderBottom: panelBorder(theme),
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    justifyContent: 'space-between',
    lineHeight: '27px',
    fontWeight: 500,
    flexShrink: 0,
    padding: padded ? '0 10px' : 0,
    '&:not(:first-child)': {
      borderTop: panelBorder(theme),
    },
  }), ['floating', 'padded', 'collapsed']));
  
  static PanelBody = styled(FlexColumn, 'PanelBody')(styleCreator(({theme, floating, padded}) => ({
    ...theme.panel.body,
    backgroundColor: theme.colors.backgroundStatus,
    border: floating ? panelBorder(theme) : 'none',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    borderTop: 'none',
    flexGrow: 1,
    padding: padded ? 10 : 0,
    overflow: 'visible',
  }), ['floating', 'padded', 'collapsed']));
  
  state = {
    collapsed: this.props.collapsed == null ? false : this.props.collapsed,
  };
  
  onClick = () => this.setState({collapsed: !this.state.collapsed});
  
  render() {
    const
      {
        padded,
        children,
        className,
        grow,
        floating,
        heading,
        collapsable,
        theme: {colors},
        accessory,
      } = this.props,
      {collapsed} = this.state;
    
    return (
      <Panel.PanelContainer
        className={className}
        floating={floating}
        grow={grow}
        collapsed={collapsed}>
        <Panel.PanelHeader
          floating={floating}
          padded={typeof heading === 'string'}
          onClick={this.onClick}>
          <Text>
            {collapsable && (
              <Chevron
                color={colors.text}
                name={collapsed ? 'triangle-right' : 'triangle-down'}
                size={12}
              />
            )}
            {heading}
          </Text>
          {accessory}
        </Panel.PanelHeader>
        
        {children == null || (collapsable && collapsed) ? null : (
          <Panel.PanelBody
            scrollable
            grow={grow}
            padded={padded == null ? true : padded}
            floating={floating}>
            {children}
          </Panel.PanelBody>
        )}
      </Panel.PanelContainer>
    );
  }
}
