/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import * as React from 'react'
import FlexColumn from './ui/components/FlexColumn'
import Button from './ui/components/Button'
import DetailSidebar from './chrome/DetailSidebar'
import {StatoPluginComponent,StatoPluginProps} from './plugin'
import SearchableTable from './ui/components/searchable/SearchableTable'
import textContent from './utils/textContent'
import createPaste from './fb-stubs/createPaste'
import {KeyboardActions} from "./KeyboardTypes"
import {
  TableBodyRow,
  TableColumnOrderVal,
  TableColumns,
  TableColumnSizes,
  TableHighlightedRows,
  TableRows
} from "./ui/components/table/types"
import {Plugin, PluginActions, PluginClientMessage} from "./PluginTypes"
import {Run} from "./utils/runtime"
import {isDefined} from "typeguard"
import {getLogger} from "./fb-interfaces/Logger"
import {Store} from "./reducers"

const log = getLogger(__filename)

export type TablePluginID = string;

export type TablePluginRowData = {
  id:TablePluginID;
  columns?:{
    [key:string]:any
  };
  details?:Object;
};
export type TablePluginRowItem<T> = {
  id:TablePluginID;
  rowNumber:number;
} & T;

export type TablePluginMetadata = {
  columns?:TableColumns;
  columnSizes?:TableColumnSizes;
  columnOrder?:Array<TableColumnOrderVal>;
  filterableColumns?:Set<string>;
};
type TablePluginProps<PersistedState extends TablePluginPersistedState<T>, Actions extends PluginActions<any,any>, ExtraProps, T = any> =StatoPluginProps<PersistedState> & {
  method:Actions["type"];
  resetMethod?:string;
  renderSidebar:(row:T) => any;
  buildRow:(row:T, previousData:T | null) => TableBodyRow;
} & ExtraProps;

type TablePluginPersistedDataType<T> = {
  [key in TablePluginID]:TablePluginRowItem<T>
}

export type TablePluginPersistedState<T> = {
  rows:TableRows;
  data:TablePluginPersistedDataType<T>;
  tableMetadata:TablePluginMetadata | null;
};
export type TablePluginState = {
  selectedIds:Array<TablePluginID>;
};

export type CreateTablePluginProps<RowData extends TablePluginRowData,
  State extends TablePluginState,
  Actions extends PluginActions,
  PersistedState extends TablePluginPersistedState<RowData>,
  ExtraProps = any> =
  TablePluginProps<PersistedState, Actions, ExtraProps>
  & TablePluginMetadata
  & Omit<Plugin<TablePluginProps<PersistedState, Actions, ExtraProps>,State, Actions, PersistedState>, "componentClazz" | "component">

/**
 * createTablePlugin creates a Plugin class which handles fetching data from the client and
 * displaying in in a table. The table handles selection of items and rendering a sidebar where
 * more detailed information can be presented about the selected row.
 *
 * The plugin expects the be able to subscribe to the `method` argument and recieve either an array
 * of data objects or a single data object. Each data object represents a row in the table which is
 * build by calling the `buildRow` function argument.
 *
 * The component can be constructed directly with the table metadata in props,
 or if omitted, will call the mobile plugin to dynamically determine the table metadata.
 *
 * An optional resetMethod argument can be provided which will replace the current rows with the
 * data provided. This is useful when connecting to Stato for this first time, or reconnecting to
 * the client in an unknown state.
 */

export function createTablePlugin<
  RowData extends TablePluginRowData,
  State extends TablePluginState = TablePluginState,
  Actions extends PluginActions = any,
  PersistedState extends TablePluginPersistedState<RowData> = TablePluginPersistedState<RowData>,
  ExtraProps = any,
  Props extends TablePluginProps<PersistedState, Actions, ExtraProps> = any
>(props:CreateTablePluginProps<RowData, State, Actions, PersistedState, ExtraProps>):Plugin<Props, State, Actions, PersistedState> {
  
  const
    {columns, columnSizes, columnOrder, filterableColumns} = props,
    defaultTableMetadata: TablePluginMetadata | null = Run(() => {
    return ![columns].every(isDefined) ?
      null :
      {
        columns,
        columnSizes,
        columnOrder,
        filterableColumns
      }
      
      
  })
  
  const PluginComponent = class PluginComponent extends StatoPluginComponent<Props,State, Actions, PersistedState> {
    
    static displayName = props.name
    static keyboardActions = ['clear', 'createPaste'] as KeyboardActions
    
    
    
    static defaultPersistedState = {
      rows: Array<TableBodyRow>() as TableRows,
      data: {} as TablePluginPersistedDataType<RowData>,
      tableMetadata: defaultTableMetadata
    } as PersistedState
    
    static persistedStateReducer<Type extends Actions["type"] = any>(
      persistedState: PersistedState,
      msg: PluginClientMessage<Type,Actions[Type]>
    ):Partial<PersistedState> {
      
      if (!msg)
        return persistedState
      
      const {type, payload} = msg
      
      if (type === props.resetMethod) {
        return {
          ...persistedState, rows: [], data: {}
        }
      } else if (type) {
        const newRows = []
        const newData:TablePluginPersistedDataType<RowData> = {}
        const items = (Array.isArray(payload) ? payload : [payload]) as Array<RowData>
        
        for (const item of items.reverse()) {
          if (item.id == null) {
            console.warn('The data sent did not contain an ID.', item)
          }
          
          const previousRowData:TablePluginRowItem<RowData> | null | undefined = persistedState.data[item.id]
          const newRow = props.buildRow(item, previousRowData)
          
          if (persistedState.data[item.id] == null) {
            newData[item.id] = {
              ...item,
              rowNumber: persistedState.rows.length + newRows.length
            }
            newRows.push(newRow)
          } else {
            persistedState.rows = persistedState.rows.slice(0, persistedState.data[item.id].rowNumber).concat([newRow], persistedState.rows.slice(persistedState.data[item.id].rowNumber + 1))
          }
        }
        
        return {
          ...persistedState,
          data: {
            ...persistedState.data,
            ...newData
          },
          rows: [...persistedState.rows, ...newRows]
        }
      }
      
      return persistedState
    };
    
    static exportPersistedState<PluginType extends Plugin = any>(
      _callClient: (a: string, b: PluginType | null) => Promise<PersistedState>,
      persistedState: PersistedState | null ,
      _store: Store | null
    ): Promise<PersistedState | null> {
      return Promise.resolve(persistedState)
    }
    
    init() {
      this.getTableMetadata()
    }
    
    getTableMetadata = () => {
      const
        {client} = this,
        {persistedState, setPersistedState} = this.props
      if (!persistedState.tableMetadata) {
        client.call<TablePluginMetadata>('getMetadata').then(metadata => {
          setPersistedState({
            ...persistedState,
            tableMetadata: {
              ...metadata,
              filterableColumns: new Set<string>(metadata.filterableColumns || new Set<string>())
            }
          })
        })
      }
    }
    onKeyboardAction = (action:string) => {
      if (action === 'clear') {
        this.clear()
      } else if (action === 'createPaste') {
        this.createPaste()
      }
    }
    
    clear = () => {
      this.props.setPersistedState({
        rows: [],
        data: {}
      } as PersistedState)
      this.setState({
        selectedIds: []
      })
    }
    createPaste = () => {
      const
        {persistedState} = this.props,
        {selectedIds} = this.state
      
      if (!persistedState.tableMetadata) {
        return
      }
      
      let paste = ''
      
      const
        {tableMetadata} = persistedState,
        mapFn = (row:TableBodyRow) => (tableMetadata && Object.keys(tableMetadata.columns || {}) || [])
          .map(key => textContent(row.columns[key].value))
          .join('\t')
      
      if (selectedIds.length > 0) {
        // create paste from selection
        paste = persistedState.rows.filter(row => selectedIds.indexOf(row.key) > -1).map(mapFn).join('\n')
      } else {
        // create paste with all rows
        paste = persistedState.rows.map(mapFn).join('\n')
      }
      
      createPaste(paste)
        .catch(err => log.error("Unable to create paste", err))
    }
    
    onRowHighlighted = (keys:TableHighlightedRows) => {
      this.setState({
        selectedIds: keys
      })
    } // We don't necessarily have the table metadata at the time when buildRow
    // is being used. This includes presentation layer info like which
    // columns should be filterable. This does a pass over the built rows and
    // applies that presentation layer information.
    
    applyMetadataToRows(rows:TableRows):TableRows {
      if (!this.props.persistedState.tableMetadata) {
        console.error('applyMetadataToRows called without tableMetadata present')
        return rows
      }
      
      return rows.map(r => {
        return {
          ...r,
          columns: Object.keys(r.columns).reduce((map, columnName) => {
            map[columnName].isFilterable = this.props.persistedState.tableMetadata && this.props.persistedState.tableMetadata.filterableColumns ? this.props.persistedState.tableMetadata.filterableColumns.has(columnName) : false
            return map
          }, r.columns)
        }
      })
    }
    
    renderSidebar = () => {
      const {renderSidebar} = props,
        {persistedState} = this.props,
        {
          selectedIds
        } = this.state,
        {
          data
        } = persistedState
      const selectedId = selectedIds.length !== 1 ? null : selectedIds[0]
      
      if (selectedId != null) {
        return renderSidebar(data[selectedId])
      } else {
        return null
      }
    }
    
    render() {
      const {persistedState} = this.props
      if (!persistedState.tableMetadata) {
        return 'Loading...'
      }
      
      const {
        columns,
        columnSizes,
        columnOrder
      } = persistedState.tableMetadata
      const {
        rows
      } = persistedState
      return <FlexColumn grow={true}>
        <SearchableTable key={props.id} rowLineHeight={28} floating={false} multiline={true}
                         columnSizes={columnSizes} columnOrder={columnOrder} columns={columns}
                         onRowHighlighted={this.onRowHighlighted} multiHighlight={true}
                         items={this.applyMetadataToRows(rows)} stickyBottom={true}
                         actions={<Button onClick={this.clear}>Clear Table</Button>}/>
        <DetailSidebar>{this.renderSidebar()}</DetailSidebar>
      </FlexColumn>
    }
    
  }
  
  return {
    ...props,
    componentClazz: PluginComponent,
    
  }
}
