/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import {getLogger} from "@stato/common"
import {
  BaseDevice,
  Button,
  ContextMenuComponent,
  createPaste,
  CSSProperties,
  DetailSidebar,
  Device,
  DeviceLogEntry,
  Filter,
  FlexColumn,
 StatoDevicePluginComponent,
 StatoPluginProps,
  Glyph,
  IManagedTable,
  jss,
  KeyboardActions,
  LogLevel,
  PluginModuleExport,
  PluginType,
  SearchableTable,
  SimpleThemeProps,
  styled,
  TableBodyColumn,
  TableBodyRow,
  TableColumnOrder,
  TableColumns,
  TableColumnSizes,
  Text,
  textContent,
  Theme
} from "@stato/core"

import {stato as Models} from "@stato/models"
import * as _ from "lodash"

import * as React from "react"
import {getValue, guard} from "typeguard"
import {LogRecordsPage} from "./LogRecordsPage"
import {
  COLUMNS, INITIAL_COLUMN_ORDER, LogLevelConfigs, LogPluginClasses, LogRecord, LogRecords, MaxPageCount
} from "./LogTypes"
import LogWatcher, {Counter} from "./LogWatcher"

const log = getLogger(__filename),
  LOG_WATCHER_LOCAL_STORAGE_KEY = "LOG_WATCHER_LOCAL_STORAGE_KEY"

const Icon = styled(Glyph)({
  marginTop: 5
})

function getLineCount(str: string): number {
  let count = 1

  for (let i = 0; i < str.length; i++) {
    if (str[i] === "\n") {
      count++
    }
  }

  return count
}

function getLogEntryHeight(message: string): number {
  return getLineCount(message) * 15 + 10
}

function keepKeys<T = any>(obj: T, keys: string[]): Partial<T> {
  const result: any = {}

  for (const key of Object.keys(obj)) {
    if (keys.includes(key)) {
      result[key] = _.get(obj, key)
    }
  }

  return result
}



type State = {
  pages: Array<LogRecordsPage>
  records: LogRecords
  highlightedRows: Set<string>
  counters: Array<Counter>
  sheet?: { classes: { [name in LogPluginClasses]: string } } & any
}
type Actions = {}
type PersistedState = {}
const COLUMN_SIZE = {
  type: 40,
  time: 120,
  pid: 60,
  tid: 60,
  tag: 120,
  app: 200,
  message: "flex"
}

const DEFAULT_FILTERS: Array<Filter<"enum">> = [
  {
    type: "enum",
    enum: Object.values(LogLevelConfigs).map(({ level, label }: any) => ({
      label,
      value: level
    })),
    key: "type",
    value: [],
    persistent: true
  }
]
const HiddenScrollText = styled(Text)({
  alignSelf: "baseline",
  userSelect: "none",
  lineHeight: "130%",
  marginTop: 5,
  paddingBottom: 3,
  "&::-webkit-scrollbar": {
    display: "none"
  }
})
const LogCount = styled("div")({
  borderRadius: "999em",
  fontSize: 11,
  marginTop: 4,
  minWidth: 16,
  height: 16,
  textAlign: "center",
  lineHeight: "16px",
  paddingLeft: 4,
  paddingRight: 4,
  textOverflow: "ellipsis",
  overflow: "hidden",
  whiteSpace: "nowrap"
})

function pad(chunk: {}, len: number): string {
  let str = String(chunk)
  
  while (str.length < len) {
    str = `0${str}`
  }
  
  return str
} //type LogProps = ThemedClassesProps<StatoPluginProps<PersistedState>, Classes>;

const baseStyles = (theme: Theme) => {
  const { colors, logs, getContrastText } = theme
  return {
    ...Object.keys(LogLevelConfigs).reduce(
      (map, level) => {
        // noinspection BadExpressionStatementJS
        (level as any) as LogLevel
        const config = _.get(LogLevelConfigs, level),
          logStyle = _.get(logs, level),
          iconBg = _.get(colors, level) || logStyle.color,
          iconText = getContrastText(iconBg)

        map[config.classNameAlias as LogPluginClasses] = {
          ...logStyle,
          "& .logIcon, & .logCount": {
            backgroundColor: iconBg,
            color: iconText
          }
        }
        return map
      },
      {} as { [name in LogPluginClasses]: CSSProperties }
    )
  } as any
}

type Props =StatoPluginProps<PersistedState> & SimpleThemeProps
export class LogTable extends StatoDevicePluginComponent<
  Props,
  State,
  Actions,
  PersistedState
> {
  static id = "@stato/plugin-logs"

  static keyboardActions: KeyboardActions = [
    "clear",
    "goToBottom",
    "createPaste"
  ]

  static supportsDevice(device: Device) {
    return device.os === Models.OS.OSIOS || device.os === Models.OS.OSAndroid
  }
  
  static ContextMenu = styled(ContextMenuComponent)({
    flex: 1,
    ...S.FlexColumn,
    ...S.FillHeight
  })
  
  
  private batchTimer: number | null | undefined
  
  
  onKeyboardAction = (action: string) => {
    if (action === "clear") {
      this.clearLogs()
    } else if (action === "goToBottom") {
      this.goToBottom()
    } else if (action === "createPaste") {
      this.createPaste()
    }
  }
  static restoreSavedCounters = (): Array<Counter> => {
    const savedCounters =
      window.localStorage.getItem(LOG_WATCHER_LOCAL_STORAGE_KEY) || "[]"
    return JSON.parse(savedCounters).map((counter: Counter) => ({
      ...counter,
      expression: new RegExp(counter.label, "gi"),
      count: 0
    }))
  }
  calculateHighlightedRows = (
    deepLinkPayload: string | null | undefined,
    pages: Array<LogRecordsPage>
  ): Set<string> => {
    const highlightedRows = new Set<string>()

    if (!deepLinkPayload) {
      return highlightedRows
    } // Run through array from last to first, because we want to show the last
    // time it the log we are looking for appeared.

    const pagesReversed = [...pages].reverse()

    for (let page of pagesReversed) {
      let match = false

      for (let i = page.items.length - 1; i >= 0; i--) {
        const item = page.items[i]

        if (
          item.row.filterValue &&
          item.row.filterValue.includes(deepLinkPayload)
        ) {
          highlightedRows.add(item.row.key)
          match = true
          break
        }
      }

      if (match) {
        break
      }
    }

    if (highlightedRows.size <= 0) {
      // Check if the individual lines in the deeplinkPayload is matched or not.
      const arr = deepLinkPayload.split("\n")

      for (let msg of arr) {
        for (let page of pagesReversed) {
          let match = false

          for (let i = page.items.length - 1; i >= 0; i--) {
            const item = page.items[i]

            if (item.row.filterValue && item.row.filterValue.includes(msg)) {
              highlightedRows.add(item.row.key)
              break
            }
          }

          if (match) {
            break
          }
        }
      }
    }

    return highlightedRows
  }
  tableRef: IManagedTable | null | undefined
  columns: TableColumns
  columnSizes: TableColumnSizes
  columnOrder: TableColumnOrder
  logListener: Symbol | null | undefined
  resetTableCacheIndex = -1
  batch: LogRecords = []
  counter: number = 0

  /*
   = this.state ||
   ({
   pages: [],
   records: []
   } as State)
   */
  static addEntriesToState(
    items: LogRecords,
    state: Partial<State>,
    table?: LogTable | null | undefined
  ): Partial<State> {
    let pages = [...state.pages]
    let records = [...state.records]

    for (let i = 0; i < items.length; i++) {
      const { entry, row } = items[i]
      let previousEntry: DeviceLogEntry | null | undefined = null

      if (i > 0) {
        previousEntry = items[i - 1].entry
      } else if (pages.length && records.length > 0) {
        previousEntry = records[records.length - 1].entry
      }

      const newRecord = {
        row,
        entry
      }

      if (LogTable.addRowIfNeeded(pages, newRecord, previousEntry)) {
        records.push(newRecord)
      }

      if (pages.length) {
        const currentPage = _.last(pages)

        pages = [...pages.slice(0, pages.length - 1), _.clone(currentPage)]
      }
    } // SET IF WE REMOVED A PAGE

    let resetTableCacheIndex = pages.length - 1 // FILTER TO A MAX LENGTH

    if (pages.length > MaxPageCount) {
      const overflow = pages.length - MaxPageCount,
        removedPages = pages.slice(0, overflow)
      pages = pages.slice(overflow)

      const removedRows = _.flatten(
        removedPages.map(page => page.items.map(record => record.row))
      )

      records = records.filter(({ row }) => !removedRows.includes(row))
      resetTableCacheIndex = 0 //console.info(`Removed ${removedRows.length} rows`);
    }
  
    
    guard(() => {
      table.resetTableCacheIndex = resetTableCacheIndex
    })
    
    return {
      records,
      pages
    }
  }

  static addRowIfNeeded(
    pages: Array<LogRecordsPage>,
    record: LogRecord,
    previousEntry: DeviceLogEntry | null | undefined
  ): boolean {
    let currentPage = _.last(pages)

    const previousRow = getValue(() => _.last(currentPage.items).row) // && rows.length > 0 ? rows[rows.length - 1] : null;

    const { entry } = record

    if (
      previousRow &&
      previousEntry &&
      entry.message === previousEntry.message &&
      entry.tag === previousEntry.tag &&
      previousRow.type != null
    ) {
      previousRow.columns.type.value.count++
      return false
    } else {
      if (!currentPage || currentPage.isFull) {
        currentPage = new LogRecordsPage()
        pages.push(currentPage)
      }

      currentPage.push(record)
      return true
    }
  }

  static processEntry(state: State, entry: DeviceLogEntry, key: string): LogRecord {
    const config = LogLevelConfigs[entry.type as LogLevel] //const {icon, style} = LOG_TYPES(theme)[(entry.type: string)] || LOG_TYPES(theme).debug;
    // build the item, it will either be batched or added straight away

    return {
      entry,
      row: {
        columns: {
          type: {
            value: {
              type: entry.type,
              count: 1
            },
            align: "center",
            render: (col: TableBodyColumn) => {
              const { icon } = LogLevelConfigs[col.value.type as LogLevel]
              return col.value.count > 1 ? (
                <LogCount className="logCount">{col.value.count}</LogCount>
              ) : icon ? (
                <Icon name={icon} className="logIcon" />
              ) : null
            }
          },
          time: {
            value: (
              <HiddenScrollText code={true}>
                {entry.date.toTimeString().split(" ")[0] +
                  "." +
                  pad(entry.date.getMilliseconds(), 3)}
              </HiddenScrollText>
            )
          },
          message: {
            value: (
              <HiddenScrollText code={true}>{entry.message}</HiddenScrollText>
            )
          },
          tag: {
            value: <HiddenScrollText code={true}>{entry.tag}</HiddenScrollText>,
            isFilterable: true
          },
          pid: {
            value: (
              <HiddenScrollText code={true}>
                {String(entry.pid)}
              </HiddenScrollText>
            ),
            isFilterable: true
          },
          tid: {
            value: (
              <HiddenScrollText code={true}>
                {String(entry.tid)}
              </HiddenScrollText>
            ),
            isFilterable: true
          },
          app: {
            value: <HiddenScrollText code={true}>{entry.app}</HiddenScrollText>,
            isFilterable: true
          }
        },
        className: getValue(() => state.sheet.classes[config.classNameAlias], null),
        height: getLogEntryHeight(entry.message),
        // 15px per line height + 8px padding
        type: entry.type,
        filterValue: entry.message,
        key
      }
    }
  }

  createState(_props: Props = this.props): Partial<State> {
    log.info("Create state")
    const supportedColumns = this.getDevice().supportedColumns()
    this.columns = keepKeys(COLUMNS, supportedColumns)
    this.columnSizes = keepKeys(COLUMN_SIZE, supportedColumns)
    this.columnOrder = INITIAL_COLUMN_ORDER.filter(obj =>
      supportedColumns.includes(obj.key)
    )

    const device = this.getDevice()
    if (device instanceof BaseDevice) {
      let logs = device.getLogs()
      const logCount = logs.length
      logs =
        logCount <= MaxPageCount ? logs : logs.slice(logCount - MaxPageCount)
      const initialState = LogTable.addEntriesToState(
        logs.map(log => LogTable.processEntry(
          this.state,
          log,
          String(this.counter++)
        )),
        this.state,
        this
      )
      return {
        ...initialState
      }
    } else {
      return {}
    }
  }

  clearLogListener() {
    if (this.logListener) {
      this.device.removeLogListener(this.logListener)
      this.logListener = null
    }
  }

  addLogListener() {
    this.clearLogListener()
    this.logListener = this.device.addLogListener((entry: DeviceLogEntry) => {
      const processedEntry = LogTable.processEntry(this.state,entry, String(this.counter++))
      this.incrementCounterIfNeeded(processedEntry.entry)
      this.scheduleEntryForBatch(processedEntry)
    })
  }
  
  static createState():State {
    return {
      counters: LogTable.restoreSavedCounters(),
      highlightedRows: new Set(),
      records: [],
      pages: []
    }
  }

  constructor(props: Props) {
    super(props)
    this.state = {
      ...LogTable.createState(),
      sheet: this.makeStyleSheet(props)
    } as State
  }

  incrementCounterIfNeeded = (entry: DeviceLogEntry) => {
    let counterUpdated = false
    const counters = this.state.counters.map(counter => {
      if (entry.message.match(counter.expression)) {
        counterUpdated = true

        if (counter.notify) {
          new Notification(`${counter.label}`, {
            body: "The watched log message appeared"
          })
        }

        return {
          ...counter,
          count: counter.count + 1
        }
      } else {
        return counter
      }
    })

    if (counterUpdated) {
      this.setState({
        counters
      })
    }
  }
  scheduleEntryForBatch = (item: {
    row: TableBodyRow
    entry: DeviceLogEntry
  }) => {
    // batch up logs to be processed every 250ms, if we have lots of log
    // messages coming in, then calling an setState 200+ times is actually
    // pretty expensive
    this.batch.push(item)

    if (!this.batchTimer) {
      this.batchTimer = window.setTimeout(() => {
        this.batchTimer = null
        const thisBatch = this.batch
        this.batch = []
        const newState = LogTable.addEntriesToState(thisBatch, this.state, this)
        this.setState(state => ({ ...state, ...newState }))
      }, 200)
    }
  }

  makeStyleSheet(props: Props = this.props) {
    return jss.createStyleSheet(baseStyles(props.theme)).attach()
  }

  updateTheme(props:StatoPluginProps<PersistedState, {}> = this.props) {
    if (this.state && this.state.sheet) {
      this.state.sheet.detach()
    }

    return this.makeStyleSheet(props)
  }

  componentWillReceiveProps(
    nextProps:StatoPluginProps<PersistedState, {}>,
    _nextContext: any
  ) {
    const patch: Partial<State> = {}

    if (nextProps.deepLinkPayload !== this.props.deepLinkPayload) {
      patch.highlightedRows = this.calculateHighlightedRows(
        this.props.deepLinkPayload,
        this.state.pages
      )
    }

    if (this.props.theme !== nextProps.theme) {
      patch.sheet = this.updateTheme(nextProps)
    }

    if (Object.keys(patch).length) {
      this.setState(state => ({ ...state, ...patch }))
    }
  }

  componentDidUpdate(_prevProps: Props, _prevState: State, _snapshot: any) {
    const { resetTableCacheIndex } = this

    if (this.tableRef && resetTableCacheIndex > -1) {
      this.tableRef.resetTable(resetTableCacheIndex)
      this.resetTableCacheIndex = -1
    }
  }

  componentWillMount() {
    const newState = this.createState()
    this.setState(
      state => ({
        ...state,
        ...newState,
        highlightedRows: this.calculateHighlightedRows(
          this.props.deepLinkPayload,
          this.state.pages
        )
      }),
      () => this.addLogListener()
    )
  }

  componentWillUnmount() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }

    this.clearLogListener()
  }

  clearLogs = () => {
    const { device } = this
    if (device instanceof BaseDevice) {
      device.clearLogs().catch(e => {
        console.error("Failed to clear logs: ", e)
      })
      this.setState({
        records: [],
        pages: [],
        highlightedRows: new Set(),
        counters: this.state.counters.map(counter => ({
          ...counter,
          count: 0
        }))
      })
    }
  }
  createPaste = () => {
    let paste = ""

    const mapFn = ({ row }: LogRecord): string =>
      Object.keys(COLUMNS)
        .map(key => textContent(row.columns[key].value))
        .join("\t")

    if (this.state.highlightedRows.size > 0) {
      // create paste from selection
      paste = this.state.records
        .filter(({ row }) => this.state.highlightedRows.has(row.key))
        .map(mapFn)
        .join("\n")
    } else {
      // create paste with all rows
      paste = this.state.records.map(mapFn).join("\n")
    }

    createPaste(paste)
  }
  setTableRef = (ref: IManagedTable) => {
    this.tableRef = ref
  }
  goToBottom = () => {
    if (this.tableRef != null) {
      this.tableRef.scrollToBottom()
    }
  }
  onRowHighlighted = (highlightedRows: Array<string>) => {
    this.setState({
      ...this.state,
      highlightedRows: new Set(highlightedRows)
    })
  }
  renderSidebar = () => {
    return (
      <LogWatcher
        counters={this.state.counters}
        onChange={counters =>
          this.setState(
            {
              counters
            },
            () =>
              window.localStorage.setItem(
                LOG_WATCHER_LOCAL_STORAGE_KEY,
                JSON.stringify(this.state.counters)
              )
          )
        }
      />
    )
  }
  
  
  private buildContextMenuItems = () => [
    {
      type: "separator"
    },
    {
      label: "Clear all",
      click: this.clearLogs
    }
  ]
  
  private rowGetter = (record: LogRecord) => record.row

  render() {
    const {
        setTableRef,
        rowGetter,
        clearLogs,
        columnSizes,
        onRowHighlighted,
        buildContextMenuItems,
        columnOrder,
        columns
      } = this,
      { deepLinkPayload } = this.props,
      { pages, highlightedRows } = this.state

    return (
      <LogTable.ContextMenu
        buildItems={buildContextMenuItems}
        component={FlexColumn}
      >
        <SearchableTable
          tableRef={setTableRef}
          floating={false}
          multiline={true}
          columnSizes={columnSizes}
          columnOrder={columnOrder}
          columns={columns}
          rowType="page"
          items={pages}
          highlightedRows={highlightedRows}
          onRowHighlighted={onRowHighlighted}
          multiHighlight={true}
          rowGetter={rowGetter}
          defaultFilters={DEFAULT_FILTERS}
          zebra={false}
          actions={<Button onClick={clearLogs}>Clear Logs</Button>} // If the logs is opened through deeplink, then don't scroll as the row is highlighted
          stickyBottom={!(deepLinkPayload && highlightedRows.size > 0)}
        />
        <DetailSidebar>{this.renderSidebar()}</DetailSidebar>
      </LogTable.ContextMenu>
    )
  }
}

// const LogTableHot = hot(LogTable)
// Object.assign(LogTableHot,{
//   ..._.pick(LogTable, 'supportsDevice', 'id', 'keyboardActions')
// })
export default {
  id: LogTable.id,
  type: PluginType.Device,
  componentClazz: LogTable // LogTableHot as any
} as PluginModuleExport<typeof LogTable, any, any, any, any, PluginType.Device>
