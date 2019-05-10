/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import type {
  TableColumnKeys,
  TableColumnSizes,
  TableOnAddFilter,
  TableBodyRow,
} from './types.js';
import React from 'react'
import classNames from 'classnames';
import FilterRow from '../filter/FilterRow.js';
import * as Styles from '../../styled/flex-styles';
import {normaliseColumnWidth} from './utils.js';
import {DEFAULT_ROW_HEIGHT} from './types';
import {withStyles} from '../../themes';
import type {Theme,ThemedClassesProps} from '../../themes';

import {lighten} from '@material-ui/core/styles/colorManipulator';
import type {ThemedProps} from '../../styled';

const backgroundColor = props => {
  const {theme: {colors}} = props;
  if (props.highlighted) {
    if (props.highlightedBackgroundColor) {
      return props.highlightedBackgroundColor;
    } else {
      return colors.backgroundSelected;
    }
  } else {
    if (props.backgroundColor) {
      return props.backgroundColor;
    } else if (props.even && props.zebra) {
      return lighten(colors.background, 0.1);
    } else {
      return 'transparent';
    }
  }
};


// const TableBodyRowContainer = makeRootView(({colors}: Theme) => ({
//
//
//       '&:hover': {
//         backgroundColor: ({highlightOnHover,highlighted}) =>
//           !highlighted && highlightOnHover ? colors.backgroundSelected : 'none',
//       },
//
//   }));
//['highlighted', 'highlightOnHover', 'highlightedBackgroundColor','zebra','even','backgroundColor','rowLineHeight','multiline','justifyContent'])

type ColumnContainerClasses = 'root' | 'multiline';

type ColumnContainerProps = {
  width: string,
  multiline: boolean,
  justifyContent: string
};
const TableBodyColumnContainer = withStyles<ColumnContainerProps, ColumnContainerClasses>(({colors}: Theme) => ({
  root: {
    display: 'flex',
    flexShrink: 0,
    overflow: 'hidden',
    padding: '0 8px',
    userSelect: 'none',
    textOverflow: 'ellipsis',
    verticalAlign: 'top',
    whitespace: 'nowrap',
    wordWrap: 'normal',
    maxWidth: '100%',
  },
  multiline: {
    whiteSpace: 'normal',
    wordWrap: 'break-word',
  },
}))(class TableBodyColumnContainer extends React.PureComponent<ThemedClassesProps<ColumnContainerProps,Classes>> {
  
  render() {
    const {width, multiline, justifyContent, classes, children} = this.props;
    
    return <div
      className={classNames(classes.root, {
        multiline,
      })}
      style={{
        justifyContent,
        width: width === 'flex' ? '100%' : width,
      }}
    >{children}</div>;
  }
});

type RowClasses = 'root' | 'zebra' | 'highlighted' | 'multiline' | 'highlightOnHover'

const rowBaseStyles = ({colors}) => {
  
  return {
    root: {
      ...Styles.FlexRow,
      boxShadow: `inset 0 -1px ${colors.border}`,
      overflow: 'hidden',
      width: '100%',
      userSelect: 'none',
      flexShrink: 0,
      '& img': {
        backgroundColor: 'none',
      },
      
    },
    zebra: {
      boxShadow: 'none',
    },
    highlighted: {
      color: colors.textSelected,
      '& *': {
        color: `${colors.text} !important`,
      },
      '& img': {
        backgroundColor: `${colors.backgroundSelected} !important`,
      },
      
      
    },
    multiline: {
      height: 'auto',
    },
    highlightOnHover: {
      '&:hover': {
        backgroundColor: colors.backgroundSelected,
      },
    },
  };
};


type Props = {
  className?: ?string,
  columnSizes: TableColumnSizes,
  columnKeys: TableColumnKeys,
  onMouseDown: (e: SyntheticMouseEvent<>) => mixed,
  onMouseEnter?: (e: SyntheticMouseEvent<>) => void,
  multiline: ?boolean,
  rowLineHeight: number,
  highlighted: boolean,
  row: TableBodyRow,
  index: number,
  style: ?Object,
  onAddFilter?: TableOnAddFilter,
  zebra: ?boolean,
};

const TableRow = withStyles<Props,RowClasses>(rowBaseStyles, {withTheme: true})(class TableRow extends React.PureComponent<ThemedClassesProps<Props,RowClasses>> {
  static defaultProps = {
    zebra: true,
  };
  
  render() {
    const
      {
        index,
        classes,
        highlighted,
        rowLineHeight,
        row,
        style,
        multiline,
        fontWeight,
        columnKeys,
        columnSizes,
        onMouseEnter,
        onMouseDown,
        zebra,
        className,
        onAddFilter,
        color
      } = (this.props: any),
      
      rowStyle = {
        ...style,
        ...(row.style || {}),
        height: row.height ? row.height : multiline ? 'auto' : rowLineHeight,
        lineHeight: `${String(rowLineHeight || DEFAULT_ROW_HEIGHT)}px`,
        fontWeight: fontWeight || 'inherit',
        backgroundColor: backgroundColor(this.props),
        color: color || 'inherit',
      };
    
    return (
      <div
        className={classNames(classes.root, className, row.className, {
          zebra,
          multiline,
          highlightOnHover: row.highlightOnHover,
          highlighted,
        })}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        style={rowStyle}
        data-key={row.key}>
        {columnKeys.map(key => {
          const col = row.columns[key];
          
          const isFilterable = col?.isFilterable || false;
          const value = col?.value;
          const title = col?.title;
          const node = col.render ? col.render(col) : value;
          return (
            <TableBodyColumnContainer
              key={key}
              title={title}
              multiline={multiline}
              justifyContent={col?.align || 'flex-start'}
              width={normaliseColumnWidth(columnSizes[key])}>
              {isFilterable && onAddFilter != null ? (
                <FilterRow addFilter={onAddFilter} filterKey={key}>
                  {node}
                </FilterRow>
              ) : (
                node
              )}
            </TableBodyColumnContainer>
          );
        })}
      </div>
    );
  }
});

export default TableRow;
