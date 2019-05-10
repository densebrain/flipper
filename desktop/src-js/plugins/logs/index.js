/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import type {
  TableBodyRow,
  TableColumnOrder,
  TableColumnSizes,
  TableColumns,
  TableBodyColumn,
  ThemedProps,
  ThemedClassNames,
  ThemedClassMap,
  ThemedClassesProps,
  FlipperPluginProps,
  LogLevel,
  Theme,
  Filter,
  ThemeStylesCallback,
} from 'flipper';
import type {Counter} from './LogWatcher.js';
import type {DeviceLogEntry} from '../../devices/BaseDevice.js';
import type {Props as PluginProps} from '../../plugin';
import _ from 'lodash';
import {getValue} from 'typeguard';
import {
  jss,
  Text,
  ManagedTable,
  Button,
  colors,
  ContextMenu,
  FlexColumn,
  Glyph,
  DetailSidebar,
  FlipperDevicePlugin,
  SearchableTable,
  styled,
  Device,
  createPaste,
  textContent,
  styleCreator,
  withStyles,
  
  ManagedTableDataPage,
} from 'flipper';
import LogWatcher from './LogWatcher';


const LOG_WATCHER_LOCAL_STORAGE_KEY = 'LOG_WATCHER_LOCAL_STORAGE_KEY';

type LogRecord = {
  row: TableBodyRow,
  entry: DeviceLogEntry,
};

type LogRecords = Array<LogRecord>;


const Icon = styled(Glyph)({
  marginTop: 5,
});

function getLineCount(str: string): number {
  let count = 1;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\n') {
      count++;
    }
  }
  return count;
}

function getLogEntryHeight(message: string): number {
  return getLineCount(message) * 15 + 10;
}

function keepKeys(obj, keys) {
  const result = {};
  for (const key in obj) {
    if (keys.includes(key)) {
      result[key] = obj[key];
    }
  }
  return result;
}


class LogRecordsPage extends ManagedTableDataPage<LogRecord> {
  
  static counter = 0;
  
  constructor(...records: Array<LogRecord>) {
    super(`page-${LogRecordsPage.counter++}`, ...records);
  }
  
  
  getItemHeight(item: LogRecord) {
    return item.row.height || 0;
  }
  
  getTableRow(item: LogRecord) {
    return item.row;
  }
  
  getMaxItemsPerPage() {
    return PageSize;
  }
}

type State = {
  pages: Array<LogRecordsPage>,
  records: LogRecords,
  highlightedRows: Set<string>,
  counters: Array<Counter>,
  sheet: ThemedClassMap<Classes> & any
};

type Actions = {||};

type PersistedState = {||};


const COLUMN_SIZE = {
  type: 40,
  time: 120,
  pid: 60,
  tid: 60,
  tag: 120,
  app: 200,
  message: 'flex',
};

const COLUMNS = {
  type: {
    value: '',
  },
  time: {
    value: 'Time',
  },
  pid: {
    value: 'PID',
  },
  tid: {
    value: 'TID',
  },
  tag: {
    value: 'Tag',
  },
  app: {
    value: 'App',
  },
  message: {
    value: 'Message',
  },
};

const INITIAL_COLUMN_ORDER = [
  {
    key: 'type',
    visible: true,
  },
  {
    key: 'time',
    visible: false,
  },
  {
    key: 'pid',
    visible: false,
  },
  {
    key: 'tid',
    visible: false,
  },
  {
    key: 'tag',
    visible: true,
  },
  {
    key: 'app',
    visible: true,
  },
  {
    key: 'message',
    visible: true,
  },
];

//type LogLevel = 'verbose' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
type Classes =
  'logRowUnknown' |
  'logRowVerbose' |
  'logRowDebug' |
  'logRowInfo' |
  'logRowWarn' |
  'logRowError' |
  'logRowFatal';

type LogLevelConfig = {|
  icon?: ?string,
  label: string,
  level: LogLevel,
  classNameAlias: Classes
|};


function makeLogLevelConfig(level: LogLevel, label: string = _.capitalize(level), icon?: ?string = null): LogLevelConfig {
  return {
    level,
    label,
    icon,
    classNameAlias: (`logRow${_.capitalize(level)}`: any),
  };
}

const LogLevelConfigs: { [level: LogLevel]: LogLevelConfig } =
  [
    ['unknown'],
    ['verbose'],
    ['debug'],
    ['info', 'Info', 'info-circle'],
    ['warn', 'Warn', 'caution-triangle'],
    ['error', 'Error', 'caution-octagon'],
    ['fatal', 'Fatal', 'stop'],
  ].map(args =>
    makeLogLevelConfig(...args),
  ).reduce((map, config) => {
    map[config.level] = config;
    return map;
  }, {});

const
  MaxPageCount = 100,
  PageSize = 50;

const baseStyles: ThemeStylesCallback<Classes> = (theme: Theme) => {
  const {colors, logs, getContrastText} = theme;
  
  return {
    ...Object.keys(LogLevelConfigs).reduce((map, level) => {
      // noinspection BadExpressionStatementJS
      ((level: any): LogLevel);
      
      const
        config = LogLevelConfigs[level],
        logStyle = logs[level],
        iconBg = colors[(level: any)] || logStyle.color,
        iconText = getContrastText(iconBg);
      
      map[config.classNameAlias] = {
        ...logStyle,
        '& .logIcon, & .logCount': {
          backgroundColor: iconBg,
          color: iconText,
        },
      };
      
      return map;
    }, {}),
  };
};

const DEFAULT_FILTERS:Array<Filter<LogRecord>> = [
  {
    type: 'enum',
    enum: Object.values(LogLevelConfigs).map(({level, label}: any) => ({
      label,
      value: level,
    })),
    key: 'type',
    value: [],
    persistent: true
  },
];

const HiddenScrollText = styled(Text)({
  alignSelf: 'baseline',
  userSelect: 'none',
  lineHeight: '130%',
  marginTop: 5,
  paddingBottom: 3,
  '&::-webkit-scrollbar': {
    display: 'none',
  },
});

const LogCount = styled('div')({
  borderRadius: '999em',
  fontSize: 11,
  marginTop: 4,
  minWidth: 16,
  height: 16,
  textAlign: 'center',
  lineHeight: '16px',
  paddingLeft: 4,
  paddingRight: 4,
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
});

function pad(chunk: mixed, len: number): string {
  let str = String(chunk);
  while (str.length < len) {
    str = `0${str}`;
  }
  return str;
}

//type LogProps = ThemedClassesProps<FlipperPluginProps<PersistedState>, Classes>;


class LogTable extends FlipperDevicePlugin<State,
  Actions,
  PersistedState,
  {}> {
  
  initTimer: ?TimeoutID;
  batchTimer: ?TimeoutID;
  
  static keyboardActions = ['clear', 'goToBottom', 'createPaste'];
  
  static supportsDevice(device: Device) {
    return device.os === 'iOS' || device.os === 'Android';
  }
  
  onKeyboardAction = (action: string) => {
    if (action === 'clear') {
      this.clearLogs();
    } else if (action === 'goToBottom') {
      this.goToBottom();
    } else if (action === 'createPaste') {
      this.createPaste();
    }
  };
  
  restoreSavedCounters = (): Array<Counter> => {
    const savedCounters =
      window.localStorage.getItem(LOG_WATCHER_LOCAL_STORAGE_KEY) || '[]';
    return JSON.parse(savedCounters).map((counter: Counter) => ({
      ...counter,
      expression: new RegExp(counter.label, 'gi'),
      count: 0,
    }));
  };
  
  calculateHighlightedRows = (
    deepLinkPayload: ?string,
    pages: Array<LogRecordsPage>,
  ): Set<string> => {
    const highlightedRows = new Set();
    if (!deepLinkPayload) {
      return highlightedRows;
    }
    
    // Run through array from last to first, because we want to show the last
    // time it the log we are looking for appeared.
    const pagesReversed = [...pages].reverse();
    for (let page of pagesReversed) {
      let match = false;
      for (let i = page.items.length - 1; i >= 0; i--) {
        const item = page.items[i];
        if (
          item.filterValue &&
          item.filterValue.includes(deepLinkPayload)
        ) {
          highlightedRows.add(item.row.key);
          match = true;
          break;
        }
      }
      
      if (match) {
        break;
      }
    }
    
    if (highlightedRows.size <= 0) {
      // Check if the individual lines in the deeplinkPayload is matched or not.
      const arr = deepLinkPayload.split('\n');
      for (let msg of arr) {
        for (let page of pagesReversed) {
          let match = false;
          for (let i = page.items.length - 1; i >= 0; i--) {
            const item = page.items[i];
            if (item.filterValue && item.filterValue.includes(msg)) {
              highlightedRows.add(item.row.key);
              break;
            }
          }
          if (match) {
            break;
          }
        }
      }
    }
    return highlightedRows;
  };
  
  tableRef: ?ManagedTable;
  columns: TableColumns;
  columnSizes: TableColumnSizes;
  columnOrder: TableColumnOrder;
  logListener: ?Symbol;
  resetTableCacheIndex = -1;
  batch: LogRecords = [];
  counter: number = 0;
  
  
  addEntriesToState(
    items: LogRecords,
    state: $Shape<State> = this.state || {
      rows: [],
      records: [],
    },
  ): $Shape<State> {
    let pages = [...state.pages];
    let records = [...state.records];
    
    for (let i = 0; i < items.length; i++) {
      const {entry, row} = items[i];
      
      let previousEntry: ?DeviceLogEntry = null;
      
      if (i > 0) {
        previousEntry = items[i - 1].entry;
      } else if (pages.length && records.length > 0) {
        previousEntry = records[records.length - 1].entry;
      }
      
      const newRecord = {row, entry};
      
      if (this.addRowIfNeeded(pages, newRecord, previousEntry)) {
        records.push(newRecord);
      }
      
      if (pages.length) {
        const currentPage = _.last(pages);
        pages = [...pages.slice(0,pages.length - 1), _.clone(currentPage)];
      }
    }
    
    // SET IF WE REMOVED A PAGE
    let resetTableCacheIndex = pages.length - 1;
    
    // FILTER TO A MAX LENGTH
    if (pages.length > MaxPageCount) {
      const
        overflow = pages.length - MaxPageCount,
        removedPages = pages.slice(0, overflow);
      
      pages = pages.slice(overflow);
      const removedRows = _.flatten(removedPages.map(page =>
        page.items.map(record => record.row)),
      );
      records = records.filter(({row}) => !removedRows.includes(row));
      resetTableCacheIndex = 0;
      //console.info(`Removed ${removedRows.length} rows`);
    }
    
    this.resetTableCacheIndex = resetTableCacheIndex;
    
    return {
      records,
      pages
    };
  }
  
  addRowIfNeeded(
    pages: Array<LogRecordsPage>,
    record: LogRecord,
    previousEntry: ?DeviceLogEntry,
  ): boolean {
    let currentPage = _.last(pages);
    const previousRow = getValue(() => _.last(currentPage.items).row);// && rows.length > 0 ? rows[rows.length - 1] : null;
    const {entry} = record;
    if (
      previousRow &&
      previousEntry &&
      entry.message === previousEntry.message &&
      entry.tag === previousEntry.tag &&
      previousRow.type != null
    ) {
      previousRow.columns.type.value.count++;
      return false;
    } else {
      if (!currentPage || currentPage.isFull) {
        currentPage = new LogRecordsPage();
        pages.push(currentPage);
      }
      
      currentPage.push(record);
      return true;
    }
  }
  
  processEntry(
    entry: DeviceLogEntry,
    key: string,
  ): LogRecord {
    
    const config = LogLevelConfigs[(entry.type: any)];
    //const {icon, style} = LOG_TYPES(theme)[(entry.type: string)] || LOG_TYPES(theme).debug;
    // build the item, it will either be batched or added straight away
    return {
      entry,
      row: {
        columns: {
          type: {
            value: {type: entry.type, count: 1},
            align: 'center',
            render: (col: TableBodyColumn) => {
              const {icon} = LogLevelConfigs[col.value.type];
              return col.value.count > 1 ?
                <LogCount className="logCount">{col.value.count}</LogCount> :
                icon ?
                  <Icon name={icon} className="logIcon"/> :
                  null;
            },
          },
          time: {
            value: (
              <HiddenScrollText code={true}>
                {entry.date.toTimeString().split(' ')[0] +
                '.' +
                pad(entry.date.getMilliseconds(), 3)}
              </HiddenScrollText>
            ),
          },
          message: {
            value: (
              <HiddenScrollText code={true}>{entry.message}</HiddenScrollText>
            ),
          },
          tag: {
            value: <HiddenScrollText code={true}>{entry.tag}</HiddenScrollText>,
            isFilterable: true,
          },
          pid: {
            value: (
              <HiddenScrollText code={true}>{String(entry.pid)}</HiddenScrollText>
            ),
            isFilterable: true,
          },
          tid: {
            value: (
              <HiddenScrollText code={true}>{String(entry.tid)}</HiddenScrollText>
            ),
            isFilterable: true,
          },
          app: {
            value: <HiddenScrollText code={true}>{entry.app}</HiddenScrollText>,
            isFilterable: true,
          },
        },
        className: this.state.sheet.classes[config.classNameAlias],
        height: getLogEntryHeight(entry.message), // 15px per line height + 8px padding
        type: entry.type,
        filterValue: entry.message,
        key,
      },
    };
  }
  
  
  createState(props: PluginProps<PersistedState> = this.props): State {
    console.info('Create state');
    const supportedColumns = this.device.supportedColumns();
    this.columns = keepKeys(COLUMNS, supportedColumns);
    this.columnSizes = keepKeys(COLUMN_SIZE, supportedColumns);
    this.columnOrder = INITIAL_COLUMN_ORDER.filter(obj =>
      supportedColumns.includes(obj.key),
    );
    
    let logs = this.device.getLogs();
    const logCount = logs.length;
    logs = logCount <= MaxPageCount ? logs : logs.slice(logCount - MaxPageCount);
    
    const initialState = this.addEntriesToState(
      logs.map(log => this.processEntry(log, String(this.counter++))),
    );
    
    return {
      ...initialState,
    };
  }
  
  clearLogListener() {
    if (this.logListener) {
      this.device.removeLogListener(this.logListener);
      this.logListener = null;
    }
  }
  
  addLogListener() {
    this.clearLogListener();
    this.logListener = this.device.addLogListener((entry: DeviceLogEntry) => {
      const processedEntry = this.processEntry(entry, String(this.counter++));
      this.incrementCounterIfNeeded(processedEntry.entry);
      this.scheduleEntryForBatch(processedEntry);
    });
  }
  
  constructor(props: PluginProps<PersistedState>) {
    super(props);
    
    this.state = {
      sheet: this.makeStyleSheet(props),
      counters: this.restoreSavedCounters(),
      highlightedRows: new Set(),
      records: [],
      pages: [],
    };
    
  }
  
  incrementCounterIfNeeded = (entry: DeviceLogEntry) => {
    let counterUpdated = false;
    const counters = this.state.counters.map(counter => {
      if (entry.message.match(counter.expression)) {
        counterUpdated = true;
        if (counter.notify) {
          new window.Notification(`${counter.label}`, {
            body: 'The watched log message appeared',
          });
        }
        return {
          ...counter,
          count: counter.count + 1,
        };
      } else {
        return counter;
      }
    });
    if (counterUpdated) {
      this.setState({counters});
    }
  };
  
  scheduleEntryForBatch = (item: {
    row: TableBodyRow,
    entry: DeviceLogEntry,
  }) => {
    // batch up logs to be processed every 250ms, if we have lots of log
    // messages coming in, then calling an setState 200+ times is actually
    // pretty expensive
    
    this.batch.push(item);
    
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.batchTimer = null;
        const thisBatch = this.batch;
        this.batch = [];
        
        const newState = this.addEntriesToState(thisBatch, this.state);
        
        this.setState(newState);
      }, 200);
    }
  };
  
  makeStyleSheet(props: FlipperPluginProps<PersistedState, {}> = this.props) {
    return jss.createStyleSheet(baseStyles(props.theme)).attach();
  }
  
  updateTheme(props: FlipperPluginProps<PersistedState, {}> = this.props) {
    if (this.state && this.state.sheet) {
      this.state.sheet.detach();
    }
    
    return this.makeStyleSheet(props);
  }
  
  componentWillReceiveProps(nextProps: FlipperPluginProps<PersistedState, {}>, nextContext: any): void {
    const patch: $Shape<State> = {};
    if (nextProps.deepLinkPayload !== this.props.deepLinkPayload) {
      patch.highlightedRows = this.calculateHighlightedRows(
        this.props.deepLinkPayload,
        this.state.pages,
      );
    }
    
    if (this.props.theme !== nextProps.theme) {
      patch.sheet = this.updateTheme(nextProps);
    }
    
    if (Object.keys(patch).length) {
      this.setState(patch);
    }
  }
  
  componentDidUpdate(prevProps: FlipperPluginProps<PersistedState, {}>, prevState: State, snapshot: any): void {
    const {resetTableCacheIndex} = this;
    if (this.tableRef && resetTableCacheIndex > -1) {
      this.tableRef.resetTable(resetTableCacheIndex);
      this.resetTableCacheIndex = -1;
      
    }
  }
  
  componentWillMount() {
    const newState = this.createState();
    this.setState({
      ...newState,
      highlightedRows: this.calculateHighlightedRows(
        this.props.deepLinkPayload,
        this.state.pages,
      ),
    }, () => this.addLogListener());
    
  }
  
  componentWillUnmount() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    
    this.clearLogListener();
  }
  
  clearLogs = () => {
    this.device.clearLogs().catch(e => {
      console.error('Failed to clear logs: ', e);
    });
    this.setState({
      records: [],
      pages: [],
      highlightedRows: new Set(),
      counters: this.state.counters.map(counter => ({
        ...counter,
        count: 0,
      })),
    });
  };
  
  createPaste = () => {
    let paste = '';
    const mapFn = ({row}): string =>
      Object.keys(COLUMNS)
        .map(key => textContent(row.columns[key].value))
        .join('\t');
    
    if (this.state.highlightedRows.size > 0) {
      // create paste from selection
      paste = this.state.records
        .filter(({row}) => this.state.highlightedRows.has(row.key))
        .map(mapFn)
        .join('\n');
    } else {
      // create paste with all rows
      paste = this.state.records.map(mapFn).join('\n');
    }
    createPaste(paste);
  };
  
  setTableRef = (ref: React.ElementRef<typeof ManagedTable>) => {
    this.tableRef = ref;
  };
  
  goToBottom = () => {
    if (this.tableRef != null) {
      this.tableRef.scrollToBottom();
    }
  };
  
  onRowHighlighted = (highlightedRows: Array<string>) => {
    this.setState({
      ...this.state,
      highlightedRows: new Set(highlightedRows),
    });
  };
  
  renderSidebar = () => {
    return (
      <LogWatcher
        counters={this.state.counters}
        onChange={counters =>
          this.setState({counters}, () =>
            window.localStorage.setItem(
              LOG_WATCHER_LOCAL_STORAGE_KEY,
              JSON.stringify(this.state.counters),
            ),
          )
        }
      />
    );
  };
  
  static ContextMenu = styled(ContextMenu)({
    flex: 1,
  });
  
  buildContextMenuItems = () => [
    {
      type: 'separator',
    },
    {
      label: 'Clear all',
      click: this.clearLogs,
    },
  ];
  
  rowGetter = (record:LogRecord) => record.row;
  
  render() {
    //console.info("pages",this.state.pages);
    const {pages} = this.state;
    if (pages.length) {
      //console.log('pages', pages);
      //debugger;
    }
    return (
      <LogTable.ContextMenu
        buildItems={this.buildContextMenuItems}
        component={FlexColumn}>
        <SearchableTable
          innerRef={this.setTableRef}
          floating={false}
          multiline={true}
          columnSizes={this.columnSizes}
          columnOrder={this.columnOrder}
          columns={this.columns}
          rowType='page'
          items={this.state.pages}
          highlightedRows={this.state.highlightedRows}
          onRowHighlighted={this.onRowHighlighted}
          multiHighlight={true}
          rowGetter={this.rowGetter}
          defaultFilters={DEFAULT_FILTERS}
          zebra={false}
          actions={<Button onClick={this.clearLogs}>Clear Logs</Button>}
          // If the logs is opened through deeplink, then don't scroll as the row is highlighted
          stickyBottom={
            !(this.props.deepLinkPayload && this.state.highlightedRows.size > 0)
          }
        />
        <DetailSidebar>{this.renderSidebar()}</DetailSidebar>
      </LogTable.ContextMenu>
    );
  }
}

// [(LogTable: any), (LogTable: any).Naked]
//   .filter(Boolean)
//   .forEach(o =>
//     Object.assign(o, {
//
//
//
//     }),
//   );

export default LogTable;
