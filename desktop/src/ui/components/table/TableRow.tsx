/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import {TableColumnKeys, TableColumnSizes, TableOnAddFilter, TableBodyRow} from './types'
import React, {HTMLAttributes} from 'react'
import classNames from 'classnames'
import FilterRow from '../filter/FilterRow'
import * as Styles from '../../styled/flex-styles'
import {normaliseColumnWidth} from './utils'
import {DEFAULT_ROW_HEIGHT} from './types'
import {CSSProperties} from "../../styled"
import {withStyles, Theme, ThemeProps} from '../../themes'
import {lighten} from '@material-ui/core/styles/colorManipulator'
import {ColorProperty} from "csstype"

type RowClasses = "root" | "zebra" | "highlighted" | "multiline" | "highlightOnHover";

interface RowOwnProps {
  className?:string | null | undefined;
  columnSizes:TableColumnSizes;
  columnKeys:TableColumnKeys;
  onMouseDown:(e:React.MouseEvent) => any;
  onMouseEnter?:(e:React.MouseEvent) => void;
  multiline:boolean | null | undefined;
  rowLineHeight:number;
  highlighted:boolean;
  fontWeight?:number | string | undefined
  even?:boolean | null
  color?:ColorProperty | null
  backgroundColor?:ColorProperty | null
  highlightedBackgroundColor?:ColorProperty | null
  row:TableBodyRow;
  index:number;
  style:CSSProperties | null | undefined;
  onAddFilter?:TableOnAddFilter;
  zebra:boolean | null | undefined;
}

type RowProps = ThemeProps<RowOwnProps, RowClasses, true>;


const backgroundColor = (props:RowProps) => {
  const {
    theme: {
      colors
    }
  } = props
  
  if (props.highlighted) {
    if (props.highlightedBackgroundColor) {
      return props.highlightedBackgroundColor
    } else {
      return colors.backgroundSelected
    }
  } else {
    if (props.backgroundColor) {
      return props.backgroundColor
    } else if (props.even && props.zebra) {
      return lighten(colors.background, 0.1)
    } else {
      return 'transparent'
    }
  }
} // const TableBodyRowContainer = makeRootView(({colors}: Theme) => ({
//
//
//       '&:hover': {
//         backgroundColor: ({highlightOnHover,highlighted}) =>
//           !highlighted && highlightOnHover ? colors.backgroundSelected : 'none',
//       },
//
//   }));
//['highlighted', 'highlightOnHover', 'highlightedBackgroundColor','zebra','even','backgroundColor','rowLineHeight','multiline','justifyContent'])


type ColumnContainerClasses = "root" | "multiline";
type ColumnContainerProps = ThemeProps<{
  width:string;
  multiline:boolean;
  justifyContent:string;
} & HTMLAttributes<any>, ColumnContainerClasses>;
const TableBodyColumnContainer = withStyles((_theme:Theme) => ({
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
    maxWidth: '100%'
  },
  multiline: {
    whiteSpace: 'normal',
    wordWrap: 'break-word'
  }
}), {
  withTheme: true
})(
  function TableBodyColumnContainer(props:ColumnContainerProps) {
    
    const {
      width,
      multiline,
      justifyContent,
      classes,
      children
    } = props
    return <div className={classNames(classes.root, {
      multiline
    })} style={{
      justifyContent,
      width: width === 'flex' ? '100%' : width
    }}>{children}</div>
  })


const rowBaseStyles = ({
                         colors
                       }:Theme) => {
  return {
    root: {
      ...Styles.FlexRow,
      boxShadow: `inset 0 -1px ${colors.border}`,
      overflow: 'hidden',
      width: '100%',
      userSelect: 'none',
      flexShrink: 0,
      '& img': {
        backgroundColor: 'none'
      }
    },
    zebra: {
      boxShadow: 'none'
    },
    highlighted: {
      color: colors.textSelected,
      '& *': {
        color: `${colors.text} !important`
      },
      '& img': {
        backgroundColor: `${colors.backgroundSelected} !important`
      }
    },
    multiline: {
      height: 'auto'
    },
    highlightOnHover: {
      '&:hover': {
        backgroundColor: colors.backgroundSelected
      }
    }
  }
}


@withStyles(rowBaseStyles, {
  withTheme: true
})
class TableRow extends React.PureComponent<RowProps> {
  static defaultProps = {
    zebra: true
  }
  
  constructor(props:RowProps) {
    super(props)
  }
  
  render() {
    const
      {
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
      } = this.props,
      rowStyle = {
        ...style,
        ...(row.style || {}),
        height: row.height ? row.height : multiline ? 'auto' : rowLineHeight,
        lineHeight: `${String(rowLineHeight || DEFAULT_ROW_HEIGHT)}px`,
        fontWeight: (fontWeight || 'inherit') as string | number,
        backgroundColor: backgroundColor(this.props),
        color: color || 'inherit'
      } as CSSProperties
    return <div
      className={classNames(classes.root, className, row.className, {
        zebra,
        multiline,
        highlightOnHover: row.highlightOnHover,
        highlighted
      })}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      style={rowStyle}
      data-key={row.key}
    >
      {columnKeys.map(key => {
        const col = row.columns[key]
        if (!col) return <div key={key}/>
        
        const [isFilterable, title, node, align] =
          [col.isFilterable || false, col.value, col.title, col.render ? col.render(col) : col.value, col.align]
        return <TableBodyColumnContainer
          key={key}
          title={title}
          multiline={multiline}
          justifyContent={align || 'flex-start'}
          width={normaliseColumnWidth(columnSizes[key])}
        >
          {isFilterable && onAddFilter != null ? <FilterRow addFilter={onAddFilter} filterKey={key}>
            {node}
          </FilterRow> : node}
        </TableBodyColumnContainer>
      })}
    </div>
  }
  
}

export default TableRow
