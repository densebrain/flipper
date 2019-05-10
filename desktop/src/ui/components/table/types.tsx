/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import { Filter } from '../filter/types';
import _ from "lodash";
import * as React from 'react'
import {CSSProperties} from "@material-ui/styles/withStyles"


// import {
//   EventEmitter
// } from 'events'


export const MINIMUM_COLUMN_WIDTH = 100;
export const DEFAULT_COLUMN_WIDTH = 200;
export const DEFAULT_ROW_HEIGHT = 23;
export type TableColumnOrderVal = {
  key: string;
  visible: boolean;
};
export type TableColumnOrder = Array<TableColumnOrderVal>;
export type TableColumnSizes = {
  [key: string]: string | number
};
export type TableHighlightedRows = Array<string>;
export type TableColumnKeys = Array<string>;
export type TableOnColumnResize = (sizes: TableColumnSizes) => void;
export type TableOnColumnOrder = (order: TableColumnOrder) => void;
export type TableOnSort = (order: TableRowSortOrder) => void;
export type TableOnHighlight = (highlightedRows: TableHighlightedRows, e: React.MouseEvent) => void;
export type TableHeaderColumn = {
  value: string;
  sortable?: boolean;
  resizable?: boolean;
};
export type TableBodyRow = {
  key: string;
  height?: number | null | undefined;
  filterValue?: string | null | undefined;
  backgroundColor?: string | null | undefined;
  sortKey?: string | number;
  className?: string | null | undefined;
  style?: CSSProperties | undefined;
  type?: string | null | undefined;
  highlightedBackgroundColor?: string | null | undefined;
  onDoubleClick?: (e: React.MouseEvent) => void;
  copyText?: string;
  highlightOnHover?: boolean;
  columns: {
    [key: string]: TableBodyColumn
  };
};
export type TableBodyColumn = {
  sortValue?: string | number;
  isFilterable?: boolean;
  value: any;
  align?: "left" | "center" | "right";
  title?: string;
  render?: (column: TableBodyColumn) => React.ReactNode | null | undefined;
};
export type TableColumns = {
  [key: string]: TableHeaderColumn
};
export type TableRows = Array<TableBodyRow>;
export type TableRowSortOrder = {
  key: string;
  direction: "up" | "down";
};
export type TableOnDragSelect = (e: React.MouseEvent, key: string, index: number) => void;
export type TableOnAddFilter = (filter: Filter) => void;
export class ManagedTableDataPage<T extends any> {
  _allItems: Array<T>;
  _items: Array<T>;
  _key: string;
  _size: number = 0;
  _filter: ((item: T) => boolean) | null = null;
  _ready: boolean = false;
  _height: number = 0;

  _prepare() {
    if (this._ready) return;
    this._height = _.sumBy(this.items, item => this.getItemHeight(item));
    this._ready = true;
  }

  _filterItems() {
    if (typeof this._filter !== 'function') return;
    this._items = this._allItems.filter(this._filter);
    this._ready = false;
  }

  getItemHeight(_item: T): number {
    throw new Error('Not implemented');
  }

  getTableRow(_item: T): TableBodyRow {
    throw new Error('Not implemented');
  }

  getTableRows(): Array<TableBodyRow> {
    return this.items.map(item => this.getTableRow(item));
  }

  getMaxItemsPerPage(): number {
    throw new Error('Not implemented');
  }

  constructor(key: string, ...items: Array<T>) {
    this._key = key;
    this._allItems = this._items = [...items];
  }

  filter(filter: (item: T) => boolean): ManagedTableDataPage<T> {
    const copy = _.clone(this);

    if (filter !== copy._filter) {
      copy._filter = filter;

      copy._filterItems();
    }

    return copy;
  }

  resetFilter() {
    this._filter = null;
    this._items = this._allItems;
    this._ready = false;
  }

  push(...items: Array<T>) {
    this._allItems.push(...items);

    this._filterItems();
  }

  get items() {
    return this._items;
  }

  get height() {
    if (!this._ready) this._prepare();
    return this._height;
  }

  get size() {
    return this._items.length;
  }

  get sizeAll() {
    return this._allItems.length;
  }

  get isFull() {
    return this._items.length === this.getMaxItemsPerPage();
  }

  get key() {
    return this._key;
  }

}
export type TableRowAddress = {
  itemIndex: number;
  rowIndex: number;
}; // export interface ManagedTableDataProvider extends EventEmitter {
//   getRows():Array<TableBodyRow>;
//   on(event:'data-changed',listener: (newRows:Array<TableBodyRow>,oldRows:Array<TableBodyRow>) => void):void;
//   off(event:'data-changed',listener: (newRows:Array<TableBodyRow>,oldRows:Array<TableBodyRow>) => void):void;
// }
//
// export class AbstractManagedTableDataProvider extends EventEmitter implements ManagedTableDataProvider{
//
//   rows:Array<TableBodyRow>;
//   incrementedKeys:boolean;
//
//   constructor(incrementedKeys:boolean = true) {
//     super();
//     this.rows = [];
//     this.incrementedKeys = incrementedKeys;
//   }
//
//   getRows() {
//     return this.rows;
//   }
//
//
//   setRows(rows:Array<TableBodyRow>):void {
//     const oldRows = this.rows;
//     this.rows = rows;
//
//     // const resetFromIndex = -1;
//     // if (this.incrementedKeys && oldRows.length) {
//     //   const
//     //     newLastKey = newLastKey
//     //     oldLastKey = oldRows[oldRows.length - 1].key
//     // }
//     this.fireDataChanged(rows, oldRows);
//   }
//
//   fireDataChanged(newRows:Array<TableBodyRow>, oldRows:Array<TableBodyRow>):void {
//     this.emit('data-changed',newRows,oldRows)
//   }
// }

export function isTableDataPage(o:any): o is ManagedTableDataPage<any> {
  return o instanceof ManagedTableDataPage
}
