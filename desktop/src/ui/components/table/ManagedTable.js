/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import type {
  TableColumnOrder,
  TableColumnSizes,
  TableColumns,
  TableHighlightedRows,
  TableRowSortOrder,
  TableRows,
  TableBodyRow,
  TableOnAddFilter,
  TableRowAddress,
} from './types.js';

import type {MenuTemplate} from '../ContextMenu.js';

import {getValue, isNumber, isDefined} from 'typeguard';
import React from 'react';
import styled from '../../styled/index.js';
import AutoSizer from 'react-virtualized-auto-sizer';
import {VariableSizeList as List} from 'react-window';
import {clipboard} from 'electron';
import TableHead from './TableHead.js';
import TableRow from './TableRow.js';
import ContextMenu from '../ContextMenu.js';
import FlexRow from '../FlexRow';
import FlexColumn from '../FlexColumn.js';
import createPaste from '../../../fb-stubs/createPaste.js';
import debounceRender from 'react-debounce-render';
import debounce from 'lodash.debounce';
import {DEFAULT_ROW_HEIGHT} from './types';
import {ManagedTableDataPage} from './types';
import _ from 'lodash'
import {makeRootView} from '../RootView';


export type TableBodyRowGetter<T> = (item: T) => TableBodyRow;



export type ManagedTableProps = {|
  /**
   * Column definitions.
   */
  columns: TableColumns,
  /**
   * Data provider.
   */
  
  items: Array<TableBodyRow | ManagedTableDataPage<any>>,
  
  tableRef?: (table:ManagedTable | null) => void,
  
  rowGetter?: TableBodyRowGetter<any>,
  
  rowType?: 'page' | 'other',
  /**
   * Whether the table has a border.
   */
  floating?: boolean,
  /**
   * Whether a row can span over multiple lines. Otherwise lines cannot wrap and
   * are truncated.
   */
  multiline?: boolean,
  /**
   * Whether the body is scrollable. When this is set to `true` then the table
   * is not scrollable.
   */
  autoHeight?: boolean,
  /**
   * Order of columns.
   */
  columnOrder?: TableColumnOrder,
  /**
   * Size of the columns.
   */
  columnSizes?: TableColumnSizes,
  /**
   * Value to filter rows on. Alternative to the `filter` prop.
   */
  filterValue?: string,
  /**
   * Callback to filter rows.
   */
  filter?: (row: TableBodyRow) => boolean,
  /**
   * Callback when the highlighted rows change.
   */
  onRowHighlighted?: (keys: TableHighlightedRows) => void,
  /**
   * Whether rows can be highlighted or not.
   */
  highlightableRows?: boolean,
  /**
   * Whether multiple rows can be highlighted or not.
   */
  multiHighlight?: boolean,
  /**
   * Height of each row.
   */
  rowLineHeight?: number,
  /**
   * This makes it so the scroll position sticks to the bottom of the window.
   * Useful for streaming data like requests, logs etc.
   */
  stickyBottom?: boolean,
  /**
   * Used by SearchableTable to add filters for rows
   */
  onAddFilter?: TableOnAddFilter,
  /**
   * Enable or disable zebra striping
   */
  zebra?: boolean,
  /**
   * Whether to hide the column names at the top of the table.
   */
  hideHeader?: boolean,
  /**
   * Rows that are highlighted initially.
   */
  highlightedRows?: Set<string | number>,
  /**
   * Allows to create context menu items for rows
   */
  buildContextMenuItems?: () => MenuTemplate,
  /**
   * Callback when sorting changes
   */
  onSort?: (order: TableRowSortOrder) => void,
|};

type ManagedTableState = {|
  highlightedRows: Set<string | number>,
  sortOrder: ?TableRowSortOrder,
  columnOrder: TableColumnOrder,
  columnSizes: TableColumnSizes,
  shouldScrollToBottom: boolean,
  visibleStartOffset: number,
  visibleStartKey: number | string | null
|};

const Container = makeRootView(theme => ({
  flexGrow: 1,
}), FlexColumn);

class ManagedTable extends React.Component<
  ManagedTableProps,
  ManagedTableState,
> {
  static defaultProps = {
    highlightableRows: true,
    multiHighlight: false,
    autoHeight: false,
    rowType: 'other'
  };

  get items():Array<TableBodyRow | ManagedTableDataPage<any>> {
    //return this.props.provider.getRows();
    return this.props.items;
  }
  
  getTableKey = (): string => {
    return (
      'TABLE_COLUMNS_' +
      Object.keys(this.props.columns)
        .join('_')
        .toUpperCase()
    );
  };

  makeManagedTableState(props:ManagedTableProps = this.props):ManagedTableState {
    return {
      columnOrder:
        JSON.parse(window.localStorage.getItem(this.getTableKey()) || 'null') ||
        props.columnOrder ||
        Object.keys(props.columns).map(key => ({key, visible: true})),
      columnSizes: props.columnSizes || {},
      highlightedRows: props.highlightedRows || new Set(),
      sortOrder: null,
      shouldScrollToBottom: Boolean(props.stickyBottom),
      visibleStartKey: null
    };
  }
  
  tableRef = React.createRef<List>();

  scrollRef = React.createRef<HTMLDivElement>();

  dragStartIndex: ?TableRowAddress = null;

  // We want to call scrollToHighlightedRows on componentDidMount. However, at
  // this time, tableRef is still null, because AutoSizer needs one render to
  // measure the size of the table. This is why we are using this flag to
  // trigger actions on the first update instead.
  firstUpdate = true;

  // isVisibleRangeSet() {
  //   const {visibleRange:{start,end}} = this.state;
  //   return isDefined(start) && isDefined(end);
  // };
  
  onDataChange = (newRows:Array<TableBodyRow>,oldRows:Array<TableBodyRow>) => {
    // if (!this.isVisibleRangeSet())
    //   return;
    
    
    // if (!shouldScrollToBottom) {
    //
    //
    // }
  
  
    this.forceUpdate(() => {
      this.onTableUpdated();
    });
    
    
  };
  
  constructor(props:ManagedTableProps) {
    super(props);
    
    if (props.tableRef) props.tableRef(this);
    this.state = this.makeManagedTableState(props);
  }
  
  componentDidMount() {
    document.addEventListener('keydown', this.onKeyDown);
    // this.props.provider.on('data-changed',this.onDataChange);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onKeyDown);
  }

  componentWillReceiveProps(nextProps: ManagedTableProps) {
    
    // if columnSizes has changed
    if (nextProps.columnSizes !== this.props.columnSizes) {
      this.setState({
        columnSizes: {
          ...(this.state.columnSizes || {}),
          ...nextProps.columnSizes,
        },
      });
    }

    if (this.props.highlightedRows !== nextProps.highlightedRows) {
      this.setState({highlightedRows: nextProps.highlightedRows || new Set()});
    }

    // if columnOrder has changed
    if (nextProps.columnOrder !== this.props.columnOrder) {
      this.resetTable();
      this.setState({
        columnOrder: nextProps.columnOrder,
      });
    }

    
  }

  
  onTableUpdated(highlightedRowsChanged:boolean = false) {
    const
      {shouldScrollToBottom,highlightedRows} = this.state,
      newHighlightedRows = new Set([...highlightedRows].filter(key => this.items.find(row => row.key === key)));
  
    highlightedRowsChanged = highlightedRowsChanged || newHighlightedRows.size !== highlightedRows.size;
  
    if (shouldScrollToBottom && !newHighlightedRows.size) {
      this.scrollToBottom();
    } else if (highlightedRowsChanged || this.firstUpdate) {
      this.scrollToHighlightedRows(this.items);
    } else if (this.state.visibleStartKey) {
      const itemElement = document.querySelector(`[data-key=${row.key}]`);//index = this.items.findIndex(row => row.key === this.state.visibleStartKey);
      if (itemElement) {
        this.tableRef.current?.scrollTo(itemElement.offsetTop + this.state.visibleStartOffset);
      }
    }
  
    this.firstUpdate = false;
    
    if (highlightedRowsChanged) {
      this.setState({
        highlightedRows: newHighlightedRows
      });
    }
  }
  
  resetTable(fromIndex:number = 0) {
    if (this.tableRef?.current) {
      this.tableRef.current?.resetAfterIndex(fromIndex);
    }
  }
  
  componentDidUpdate(
    prevProps: ManagedTableProps,
    prevState: ManagedTableState,
  ) {
    if (prevProps.tableRef !== this.props.tableRef && this.props.tableRef) {
      this.props.tableRef(this);
    }
    this.onTableUpdated(this.props.highlightedRows !== prevProps.highlightedRows);
    
    // if (this.props.highlightedRows !== prevProps.highlightedRows) {
    //
    // }
    // if (this.props.provider !== prevProps.provider) {
    //   prevProps.provider.off('data-changed',this.onDataChange);
    //   this.props.provider.on('data-changed',this.onDataChange);
    // }
    
  }

  scrollToHighlightedRows = (rows:Array<ManagedTableDataPage<any> | TableBodyRow> = this.items) => {
    const {current} = this.tableRef;
    const {highlightedRows} = this.state;
    if (current && highlightedRows && highlightedRows.size > 0) {
      const highlightedRow = Array.from(highlightedRows)[0];
      const index = rows.findIndex(
        ({key}) => key === highlightedRow,
      );
      if (index >= 0) {
        current.scrollToItem(index);
      } else {
        this.setState({
          visibleStartKey: null
        })
      }
    }
  };

  onCopy = () => {
    clipboard.writeText(this.getSelectedText());
  };

  onKeyDown = (e: KeyboardEvent) => {
    const {highlightedRows} = this.state;
    if (highlightedRows.size === 0) {
      return;
    }
    if (
      ((e.metaKey && process.platform === 'darwin') ||
        (e.ctrlKey && process.platform !== 'darwin')) &&
      e.keyCode === 67
    ) {
      this.onCopy();
    } else if (
      (['ArrowUp','ArrowDown'].includes(e.code)) &&
      this.props.highlightableRows
    ) {
      // arrow navigation
      const {items} = this;
      const {highlightedRows} = this.state;
      const lastItemKey = Array.from(this.state.highlightedRows).pop();
      const lastItemIndex = this.getRowAddress(lastItemKey);
      if (!lastItemIndex) {
        console.warn(`Can not move current row, lastItemIndex is null for key: ${lastItemKey}`);
        return;
      }
      const isUpKey = e.code === 'ArrowUp';
      const newIndex = {...lastItemIndex};
      
      const {itemIndex, rowIndex} = lastItemIndex;
      
      if (this.isRowTypePage()) {
        const
          lastItem = ((items[itemIndex]:any ): ManagedTableDataPage<any>),
          lastItemRows = lastItem.getTableRows();
        
        const newItemIndex = newIndex.itemIndex = isUpKey ?
          // UP KEY ITEM INDEX
          (rowIndex === 0 ? Math.max(0,itemIndex - 1) : itemIndex) :
          
          // DOWN KEY ITEM INDEX
          (rowIndex + 1 >= lastItemRows.length ? Math.min(items.length - 1, itemIndex + 1) : itemIndex);
        
        const newItemRows = ((items[newItemIndex]:any ): ManagedTableDataPage<any>).getTableRows();
        
        newIndex.rowIndex = newItemIndex !== itemIndex ? (isUpKey ? Math.max(newItemRows.length - 1,0) : 0) :
          (isUpKey ? Math.max(0,rowIndex - 1) : Math.min(newItemRows.length - 1, rowIndex + 1));
        
      } else {
        newIndex.itemIndex = Math.min(
          items.length - 1,
          Math.max(0, isUpKey ? itemIndex - 1 : itemIndex + 1),
        );
      }
      
      if (!e.shiftKey) {
        highlightedRows.clear();
      }
      highlightedRows.add(this.getRowKey(newIndex.itemIndex,newIndex.rowIndex));
      this.onRowHighlighted(highlightedRows, () => {
        const row = this.getRowByAddress(newIndex);
        if (!row) {
          console.warn("No row found", newIndex);
          return;
        }
        
        const offset = this.getRowOffset(row);
        if (!isNumber(offset)) {
          console.warn("Invalid offset for row",newIndex, row);
          return;
        }
        
        const {current} = this.tableRef;
        if (current) {
          current.scrollTo(offset);
        }
      });
    }
  };

  onRowHighlighted = (highlightedRows: Set<number | string>, cb?: Function) => {
    if (!this.props.highlightableRows) {
      return;
    }
    this.setState({highlightedRows}, cb);
    const {onRowHighlighted} = this.props;
    if (onRowHighlighted) {
      onRowHighlighted(Array.from(highlightedRows));
    }
  };

  onSort = (sortOrder: TableRowSortOrder) => {
    this.setState({sortOrder});
    this.props.onSort && this.props.onSort(sortOrder);
  };

  onColumnOrder = (columnOrder: TableColumnOrder) => {
    this.setState({columnOrder});
    // persist column order
    window.localStorage.setItem(
      this.getTableKey(),
      JSON.stringify(columnOrder),
    );
  };

  onColumnResize = (columnSizes: TableColumnSizes) => {
    this.setState({columnSizes});
  };

  scrollToBottom() {
    const
      {current: table} = this.tableRef,
      {current: scroller} = this.scrollRef,
      {items} = this;

    if (table && scroller && items.length > 1) {
      const height = _.sumBy(items, 'height');
      table.scrollTo(height);
    }
  }

  onHighlight = (
    e: SyntheticMouseEvent<>,
    row: TableBodyRow,
    itemIndex: number,
    rowIndex: number = 0
  ) => {
    if (e.button !== 0 || !this.props.highlightableRows) {
      // Only highlight rows when using primary mouse button,
      // otherwise do nothing, to not interfere context menus.
      return;
    }
    if (e.shiftKey) {
      // prevents text selection
      e.preventDefault();
    }

    let highlightedRows = new Set(this.state.highlightedRows);

    this.dragStartIndex = {itemIndex,rowIndex};
    document.addEventListener('mouseup', this.onStopDragSelecting);

    if (
      ((e.metaKey && process.platform === 'darwin') || e.ctrlKey) &&
      this.props.multiHighlight
    ) {
      highlightedRows.add(row.key);
    } else if (e.shiftKey && this.props.multiHighlight) {
      // range select
      const lastItemKey = Array.from(highlightedRows).pop();
      highlightedRows = new Set([
        ...highlightedRows,
        ...this.selectInRange(lastItemKey, row.key),
      ]);
    } else {
      // single select
      highlightedRows.clear();
      highlightedRows.add(row.key);
    }

    this.onRowHighlighted(highlightedRows);
  };

  onStopDragSelecting = () => {
    this.dragStartIndex = null;
    document.removeEventListener('mouseup', this.onStopDragSelecting);
  };

  selectInRange = (fromKey: string | number, toKey: string | number): Array<string | number> => {
    const
      selected = [];
    
    let startIndex = this.getRowAddress(fromKey);
    let endIndex = this.getRowAddress(toKey);
    
    const isValid = index => index && index.itemIndex !== -1 && index.rowIndex !== -1;
    
    if (!startIndex || !endIndex || !isValid(endIndex) || !isValid(startIndex)) return selected;
    
    if (startIndex.itemIndex > endIndex.itemIndex || (startIndex.itemIndex === endIndex.itemIndex && startIndex.rowIndex > endIndex.rowIndex)) {
      const tmpIndex = startIndex;
      startIndex = endIndex;
      endIndex = tmpIndex;
    }
    
    const itemIndexes = _.range(startIndex.itemIndex, endIndex.itemIndex + 1);
    for (let itemIndex of itemIndexes) {
      const
        item = this.items[itemIndex],
        rows = item instanceof ManagedTableDataPage ? item.getTableRows() : [item],
        startRowIndex = itemIndex === startIndex.itemIndex ? startIndex.rowIndex : 0,
        endRowIndex = itemIndex === endIndex.itemIndex ? endIndex.rowIndex : rows.length - 1,
        rowIndexes = _.range(startRowIndex, endRowIndex + 1);
      
      for (let rowIndex of rowIndexes) {
        const row = rows[rowIndex];
        if (!row) continue;
        
        selected.push(row.key);
      }
    }
    

    return selected;
  };

  isRowTypePage = () => this.props.rowType === 'page';
  
  getRowByAddress(address:TableRowAddress):?TableBodyRow {
    const item = this.items[address.itemIndex];
    return item instanceof ManagedTableDataPage ? item.getTableRows()[address.rowIndex] : item;
  }
  
  getRowAddress(key:string | number):?TableRowAddress {
    let i = 0, j = 0;
    for (let item of this.items) {
      for (let row of item instanceof ManagedTableDataPage ? item.getTableRows() : [item]) {
        if (row.key === key)
          return {
            itemIndex: i,
            rowIndex: j
          };
        
        j++;
      }
      i++;
      j = 0;
    }
    return null
  }
  
  getRowOffset(row: TableBodyRow): ?number {
    const {current:scroller} = this.scrollRef;
    
  
    return !scroller ? null : scroller.querySelector(`[data-type="${row.key}"]`)?.scrollTop;
  }
  
  getRowKey(itemIndex:number, rowIndex:number):number | string {
    const item = this.items[itemIndex];
    return item instanceof ManagedTableDataPage ? item.items[rowIndex].key : item.key
  }
  
  onMouseEnterRow = (
    e: SyntheticMouseEvent<>,
    row: TableBodyRow,
    itemIndex:number,
    rowIndex: number,
  ) => {
    const {dragStartIndex} = this;
    const {current:table} = this.tableRef;
    if (
      dragStartIndex &&
      table &&
      this.props.multiHighlight &&
      this.props.highlightableRows
    ) {
      const elementOffset = this.getRowOffset(row);
      if (!isNumber(elementOffset)) return;
      
      table.scrollTo(elementOffset);
      
      const {itemIndex,rowIndex} = dragStartIndex;
      const startKey = this.getRowKey(itemIndex,rowIndex);
      const highlightedRows = new Set(this.selectInRange(startKey, row.key));
      this.onRowHighlighted(highlightedRows);
    }
  };

  buildContextMenuItems = () => {
    const {highlightedRows} = this.state;
    if (highlightedRows.size === 0) {
      return [];
    }

    return [
      {
        label:
          highlightedRows.size > 1
            ? `Copy ${highlightedRows.size} rows`
            : 'Copy row',
        click: this.onCopy,
      },
      {
        label: 'Create Paste',
        click: () => createPaste(this.getSelectedText()),
      },
    ];
  };

  getSelectedText = (): string => {
    const {highlightedRows} = this.state;

    if (highlightedRows.size === 0) {
      return '';
    }
    return this.items
      .filter(row => highlightedRows.has(row.key))
      .map(
        (row: TableBodyRow | ManagedTableDataPage<any>) =>
          row.copyText ||
          Array.from(
            document.querySelectorAll(`[data-key='${row.key}'] > *`) || [],
          )
            .map(node => node.textContent)
            .join('\t'),
      )
      .join('\n');
  };

  onScroll = debounce(
    ({
      scrollDirection,
      scrollOffset,
       scrollUpdateWasRequested
    }: {
      scrollDirection: 'forward' | 'backward',
      scrollOffset: number,
      scrollUpdateWasRequested: boolean,
    }) => {
      const {current} = this.scrollRef;
      if (!current) return;
      
      const parent = current.parentElement;
      if (!parent) return;
      
      const
        {shouldScrollToBottom} = this.state,
        {stickyBottom} = this.props,
        newState: $Shape<ManagedTableState> = {};
  
      const child = current.children[0];
      if (!child) return;
      let key = child.getAttribute("data-key");
      
      if (
        stickyBottom &&
        scrollDirection === 'forward' &&
        !shouldScrollToBottom &&
        current &&
        parent instanceof HTMLElement &&
        parent.scrollTop + (parent.clientHeight * 1.2) >= current.offsetHeight
      ) {
        newState.shouldScrollToBottom = true;
        newState.visibleStartKey = null;
        newState.visibleStartOffset = 0;
      } else if (
        this.props.stickyBottom &&
        scrollDirection === 'backward' &&
        this.state.shouldScrollToBottom
      ) {
        newState.shouldScrollToBottom = false;
      }
  
      if (
        newState.shouldScrollToBottom !== true &&
        this.state.shouldScrollToBottom !== true &&
        !scrollUpdateWasRequested &&
        key && key !== this.state.visibleStartKey
      ) {
        newState.visibleStartKey = key;
        newState.visibleStartOffset = scrollOffset - child.clientHeight;
      }
  
      if (Object.keys(newState).length)
        this.setState(newState);
    },
    250,
  );
  
  itemSize = (index:number) => {
    const
      {rowLineHeight} = this.props,
      {items} = this,
      row = items[index];
    
    return getValue(() => row.height,
      rowLineHeight ||
      DEFAULT_ROW_HEIGHT
    );
  };
  
  itemKey = (index:number, data:Array<TableBodyRow | ManagedTableDataPage<any>>) => {
    return data[index]?.key
  };
  
  
  getRow = ({index:itemIndex, isScrolling, style}) => {
    const
      {items} = this,
      {onAddFilter, multiline, zebra} = this.props,
      {columnOrder, columnSizes, highlightedRows} = this.state,
      item = items[itemIndex];
    
    if (isScrolling === true) {
      const style = {height: item.height};
      return <FlexRow style={style} />
    }
    
    const
      columnKeys = columnOrder
        .map(k => (k.visible ? k.key : null))
        .filter(Boolean),
      
    tableRows = item instanceof ManagedTableDataPage ? item.getTableRows() : [item],
    tableElements = tableRows.map((row, rowIndex) => {
      return <TableRow
        key={row.key}
        className={row.className}
        columnSizes={columnSizes}
        columnKeys={columnKeys}
        onMouseDown={e => this.onHighlight(e, row, itemIndex, rowIndex)}
        onMouseEnter={e => this.onMouseEnterRow(e, row, itemIndex, rowIndex)}
        multiline={multiline}
        rowLineHeight={24}
        highlighted={highlightedRows.has(row.key)}
        row={row}
        index={itemIndex}
        onAddFilter={onAddFilter}
        zebra={zebra}
        {...(this.isRowTypePage() ? {
          height: row.height
        } : {style})}
      />});
      
    return this.isRowTypePage() ? <FlexColumn key={item.key} style={style}>
      {tableElements}
    </FlexColumn> : tableElements[0];
  };

  render() {
    const
      {columns, rowLineHeight, hideHeader, autoHeight} = this.props,
      {items} = this,
      {columnOrder, columnSizes} = this.state;
    
    return (
      <Container>
        {hideHeader !== true && (
          <TableHead
            columnOrder={columnOrder}
            onColumnOrder={this.onColumnOrder}
            columns={columns}
            onColumnResize={this.onColumnResize}
            sortOrder={this.state.sortOrder}
            columnSizes={columnSizes}
            onSort={this.onSort}
          />
        )}
        <Container>
          {autoHeight ? (
            items.map((_, index) => this.getRow({index,isScrolling:false, style: {}}))
          ) : (
            <AutoSizer>
              {({width, height}) => (
                <ContextMenu
                  buildItems={
                    this.props.buildContextMenuItems ||
                    this.buildContextMenuItems
                  }>
                  <List
                    itemData={items}
                    itemCount={items.length}
                    itemSize={this.itemSize}
                    ref={this.tableRef}
                    itemKey={this.itemKey}
                    width={width}
                    overscanCount={0}
                    innerRef={this.scrollRef}
                    onScroll={this.onScroll}
                    height={height}>
                    {this.getRow}
                  </List>
                </ContextMenu>
              )}
            </AutoSizer>
          )}
        </Container>
      </Container>
    );
  }
}

export default ManagedTable//debounceRender(ManagedTable, 150, {maxWait: 250});
