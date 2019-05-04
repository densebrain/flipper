/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import type {Filter} from 'flipper';
import {PureComponent} from 'react';
import Text from '../Text.js';
import styled,{styleCreator} from '../../styled/index.js';
import {withStyles} from '../../themes';
import {findDOMNode} from 'react-dom';
import {colors} from '../../themes/colors.js';
import electron from 'electron';
import {lighten,darken} from '@material-ui/core/styles/colorManipulator';


const Token = withStyles(({colors}) => ({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: ({focused,color}) => focused
      ? colors.backgroundSelected
      : color || lighten(colors.background, 0.1),
    border: ({focused}) => focused
      ? 'none'
      : colors.border,
    borderRadius: 4,
    marginRight: 4,
    padding: 4,
    paddingLeft: 6,
    height: 21,
    color: ({focused,color}) => focused ? colors.textSelected : colors.text,
    '&:active': {
      backgroundColor: colors.backgroundSelected,
      color: colors.textSelected,
    },
    '&:first-of-type': {
      marginLeft: 3,
    }
  },
}))(React.forwardRef(({style, classes,focused,color,className,...other},ref) => {
  return <Text innerRef={ref} style={style} className={`${classes.root} ${className}`} {...other}/>
}));

const Key = withStyles(({colors}) => ({
  root: {
    position: 'relative',
    fontWeight: 500,
    paddingRight: 12,
    textTransform: 'capitalize',
    lineHeight: '21px',
    '&:after': {
      content: ({type}) => type === 'exclude' ? '"≠"' : '"="',
      paddingLeft: 5,
      position: 'absolute',
      top: -1,
      right: 0,
      fontSize: 14,
    },
    '&:active:after': {
      backgroundColor: colors.backgroundSelected,
    },
  }
}))(function Key({style, classes,className,...other}) {
  return <Text style={style} className={`${classes.root} ${className}`} {...other}/>
});

const Value = withStyles(() => ({
  root: {
    whiteSpace: 'nowrap',
    maxWidth: 160,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: '21px',
    paddingLeft: 3,
  }
}))(function Value({style, classes,className,...other}) {
  return <Text style={style} className={`${classes.root} ${className}`} {...other}/>
});

const Chevron = withStyles(({colors}) => ({
  root: {
    border: 0,
    paddingLeft: 3,
    paddingRight: 1,
    marginRight: 0,
    fontSize: 16,
    backgroundColor: 'transparent',
    position: 'relative',
    top: -2,
    height: 'auto',
    lineHeight: 'initial',
    color: ({focused}) => focused ? colors.textSelected : 'inherit',
    '&:hover, &:active, &:focus': {
      color: 'inherit',
      border: 0,
      backgroundColor: 'transparent',
    },
  }
}))(function Chevron({classes,focused,style,className,...other}) {
  return <div  style={style} className={`${classes.root} ${className}`} {...other}/>
});

type Props = {|
  filter: Filter,
  focused: boolean,
  index: number,
  onFocus: (focusedToken: number) => void,
  onBlur: () => void,
  onDelete: (deletedToken: number) => void,
  onReplace: (index: number, filter: Filter) => void,
|};

export default class FilterToken extends PureComponent<Props> {
  _ref: ?Element;

  onMouseDown = () => {
    if (
      this.props.filter.persistent !== true
    ) {
      this.props.onFocus(this.props.index);
    }
    this.showDetails();
  };

  showDetails = () => {
    const menuTemplate = [];

    if (this.props.filter.type === 'enum') {
      menuTemplate.push(
        ...this.props.filter.enum.map(({value, label}) => ({
          label,
          click: () => this.changeEnum(value),
          type: 'checkbox',
          checked: this.props.filter.value.indexOf(value) > -1,
        })),
      );
    } else {
      if (this.props.filter.value.length > 23) {
        menuTemplate.push(
          {
            label: this.props.filter.value,
            enabled: false,
          },
          {
            type: 'separator',
          },
        );
      }

      menuTemplate.push(
        {
          label:
            this.props.filter.type === 'include'
              ? `Entries excluding "${this.props.filter.value}"`
              : `Entries including "${this.props.filter.value}"`,
          click: this.toggleFilter,
        },
        {
          label: 'Remove this filter',
          click: () => this.props.onDelete(this.props.index),
        },
      );
    }
    const menu = electron.remote.Menu.buildFromTemplate(menuTemplate);
    const {bottom, left} = this._ref ? this._ref.getBoundingClientRect() : {};
    menu.popup({
      window: electron.remote.getCurrentWindow(),
      async: true,
      x: parseInt(left, 10),
      y: parseInt(bottom, 10) + 8,
    });
  };

  toggleFilter = () => {
    const {filter, index} = this.props;
    if (filter.type !== 'enum') {
      const newFilter: Filter<any> = {
        ...filter,
        type: filter.type === 'include' ? 'exclude' : 'include',
      };
      this.props.onReplace(index, newFilter);
    }
  };

  changeEnum = (newValue: string) => {
    const {filter, index} = this.props;
    if (filter.type === 'enum') {
      let {value} = filter;
      if (value.indexOf(newValue) > -1) {
        value = value.filter(v => v !== newValue);
      } else {
        value = value.concat([newValue]);
      }
      if (value.length === filter.enum.length) {
        value = [];
      }
      const newFilter: Filter = {
        type: 'enum',
        ...filter,
        value,
      };
      this.props.onReplace(index, newFilter);
    }
  };

  setRef = (ref: React.ElementRef<*>) => {
    const element = findDOMNode(ref);
    if (element instanceof HTMLElement) {
      this._ref = element;
    }
  };

  render() {
    const {filter} = this.props;
    let color;
    let value = '';

    if (filter.type === 'enum') {
      const getEnum = value => filter.enum.find(e => e.value === value);
      const firstValue = getEnum(filter.value[0]);
      const secondValue = getEnum(filter.value[1]);
      if (filter.value.length === 0) {
        value = 'All';
      } else if (filter.value.length === 2 && firstValue && secondValue) {
        value = `${firstValue.label} or ${secondValue.label}`;
      } else if (filter.value.length === 1 && firstValue) {
        value = firstValue.label;
        color = firstValue.color;
      } else if (firstValue) {
        value = `${firstValue.label} or ${filter.value.length - 1} others`;
      }
    } else {
      value = filter.value;
    }

    return (
      <Token
        key={`${filter.key}:${value}=${filter.type}`}
        tabIndex={-1}
        onMouseDown={this.onMouseDown}
        focused={this.props.focused}
        color={color}
        innerRef={this.setRef}>
        <Key type={this.props.filter.type} focused={this.props.focused}>
          {filter.key}
        </Key>
        <Value>{value}</Value>
        <Chevron tabIndex={-1} focused={this.props.focused}>
          &#8964;
        </Chevron>
      </Token>
    );
  }
}
