/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from "react"
import {
  Button,
  colors,
  ContextMenuComponent,
  DetailSidebar,
  FlexColumn,
  StatoPluginComponent,
  StatoPluginProps,
  Glyph,
  KeyboardActions,
  Notification,
  PluginModuleExport,
  PluginType,
  PureComponent,
  SearchableTable,
  styled,
  TableBodyRow,
  TableHighlightedRows,
  TableRows,
  Text
} from "@stato/core"
import { stato as Models } from "@stato/models"
import { padStart } from "lodash"
import RequestDetails from "./RequestDetails"
import { URL } from "url"
import { oc } from "ts-optchain"

type RequestId = string

type RequestMap = {
  [id in RequestId]:Request
}

type ResponseMap = {
  [id in RequestId]:Response
}

type PersistedState = {
  requests:RequestMap,
  responses:ResponseMap
}
type State = {
  selectedIds:Array<RequestId>
}
export type Request = {
  id:RequestId,
  timestamp:number,
  method:string,
  url:string,
  headers:Array<Header>,
  data:string | null | undefined
}
export type Response = {
  id:RequestId,
  timestamp:number,
  status:number,
  reason:string,
  headers:Array<Header>,
  data:string | null | undefined
}
export type Header = {
  key:string,
  value:string
}
const COLUMN_SIZE = {
  requestTimestamp: 100,
  responseTimestamp: 100,
  domain: "flex",
  method: 100,
  status: 70,
  size: 100,
  duration: 100
}
const COLUMN_ORDER = [
  {
    key: "requestTimestamp",
    visible: true
  },
  {
    key: "responseTimestamp",
    visible: false
  },
  {
    key: "domain",
    visible: true
  },
  {
    key: "method",
    visible: true
  },
  {
    key: "status",
    visible: true
  },
  {
    key: "size",
    visible: true
  },
  {
    key: "duration",
    visible: true
  }
]
const COLUMNS = {
  requestTimestamp: {
    value: "Request Time"
  },
  responseTimestamp: {
    value: "Response Time"
  },
  domain: {
    value: "Domain"
  },
  method: {
    value: "Method"
  },
  status: {
    value: "Status"
  },
  size: {
    value: "Size"
  },
  duration: {
    value: "Duration"
  }
}

export function getHeaderValue(headers:Array<Header>, key:string):string {
  for (const header of headers) {
    if (header.key.toLowerCase() === key.toLowerCase()) {
      return header.value
    }
  }
  
  return ""
}

export function formatBytes(count:number):string {
  if (count > 1024 * 1024) {
    return (count / (1024.0 * 1024)).toFixed(1) + " MB"
  }
  
  if (count > 1024) {
    return (count / 1024.0).toFixed(1) + " kB"
  }
  
  return count + " B"
}

const TextEllipsis = styled(Text)({
  overflowX: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "100%",
  lineHeight: "18px",
  paddingTop: 4
})

type Actions = {
  newResponse:{ type:"newResponse" } & Response
  newRequest:{ type:"newRequest" } & Request
}


type Props = StatoPluginProps<PersistedState>

class NetworkPluginComponent extends StatoPluginComponent<Props, State, Actions, PersistedState> {
  
  static id = "@stato/plugin-network"
  
  static keyboardActions:KeyboardActions = ["clear"]
  
  static defaultPersistedState = {
    requests: {},
    responses: {}
  } as PersistedState
  
  static persistedStateReducer = (
    persistedState:PersistedState,
    msg:Models.PluginCallRequestResponse
  ):PersistedState => {
    
    const
      { method, body } = msg,
      payload = JSON.parse(body || "[]") as (Request | Response)
    
    if (method === "newRequest") {
      return { ...persistedState, requests: { ...persistedState["requests"], [payload.id]: payload as Request } }
    } else if (method === "newResponse") {
      return { ...persistedState, responses: { ...persistedState["responses"], [payload.id]: payload as Response } }
    }
    return persistedState
  }
  
  
  static getActiveNotifications = (persistedState:PersistedState):Array<Notification> => {
    const responses = (persistedState ? persistedState.responses || {} : {}) as ResponseMap
    
    const r:Array<Response> = Object.values(responses)
    return r // Show error messages for all status codes indicating a client or server error
      .filter((response:Response) => response.status >= 400)
      .map((response:Response) => ({
        id: response.id,
        title: `HTTP ${response.status}: Network request failed`,
        message: `Request to "${oc(persistedState.requests[response.id as RequestId]).url() || "(URL missing)"}" failed. ${
          response.reason
          }`,
        severity: "error",
        timestamp: response.timestamp,
        category: `HTTP${response.status}`,
        action: response.id
      }))
  }
  
  
  constructor(props:Props) {
    super(props)
    this.state = {
      selectedIds: this.props.deepLinkPayload ? [this.props.deepLinkPayload] : []
    }
  }
  
  
  onKeyboardAction = (action:string) => {
    if (action === "clear") {
      this.clearLogs()
    }
  }
  
  onRowHighlighted = (selectedIds:Array<RequestId>) =>
    this.setState({
      selectedIds
    })
  clearLogs = () => {
    this.setState({
      selectedIds: []
    })
    this.props.setPersistedState({
      responses: {},
      requests: {}
    })
  }
  renderSidebar = () => {
    const { requests, responses } = this.props.persistedState
    const { selectedIds } = this.state
    const selectedId = selectedIds.length === 1 ? selectedIds[0] : null
    return selectedId != null ? (
      <RequestDetails key={selectedId} request={requests[selectedId]} response={responses[selectedId]}/>
    ) : null
  }
  
  render() {
    const { requests, responses } = this.props.persistedState
    return (
      <FlexColumn grow={true}>
        <NetworkTable
          requests={requests || {}}
          responses={responses || {}}
          clear={this.clearLogs}
          onRowHighlighted={this.onRowHighlighted}
          highlightedRows={this.state.selectedIds ? new Set(this.state.selectedIds) : null}
        />
        <DetailSidebar width={500}>{this.renderSidebar()}</DetailSidebar>
      </FlexColumn>
    )
  }
}

type NetworkTableProps = {
  requests:{
    [id in RequestId]:Request
  },
  responses:{
    [id in RequestId]:Response
  },
  clear:() => void,
  onRowHighlighted:(keys:TableHighlightedRows) => void,
  highlightedRows:Set<string> | null | undefined
}
type NetworkTableState = {
  sortedRows:TableRows
}

function formatTimestamp(timestamp:number):string {
  const date = new Date(timestamp)
  return `${padStart(date.getHours().toString(), 2, "0")}:${padStart(date.getMinutes().toString(), 2, "0")}:${padStart(
    date.getSeconds().toString(),
    2,
    "0"
  )}.${padStart(date.getMilliseconds().toString(), 3, "0")}`
}

function buildRow(request:Request, response:Response | null | undefined):TableBodyRow | null | undefined {
  if (request == null) {
    return
  }
  
  const url = new URL(request.url)
  const domain = url.host + url.pathname
  const friendlyName = getHeaderValue(request.headers, "X-FB-Friendly-Name")
  return {
    columns: {
      requestTimestamp: {
        value: <TextEllipsis>{formatTimestamp(request.timestamp)}</TextEllipsis>
      },
      responseTimestamp: {
        value: <TextEllipsis>{response && formatTimestamp(response.timestamp)}</TextEllipsis>
      },
      domain: {
        value: <TextEllipsis>{friendlyName ? friendlyName : domain}</TextEllipsis>,
        isFilterable: true
      },
      method: {
        value: <TextEllipsis>{request.method}</TextEllipsis>,
        isFilterable: true
      },
      status: {
        value: <StatusColumn>{response ? response.status : undefined}</StatusColumn>,
        isFilterable: true
      },
      size: {
        value: <SizeColumn response={response ? response : undefined}/>
      },
      duration: {
        value: <DurationColumn request={request} response={response}/>
      }
    },
    key: request.id,
    filterValue: `${request.method} ${request.url}`,
    sortKey: request.timestamp,
    copyText: request.url,
    highlightOnHover: true
  }
}

function calculateState(
  props:PersistedState,
  nextProps:PersistedState,
  rows:TableRows = []
):NetworkTableState {
  rows = [...rows]
  
  if (Object.keys(nextProps.requests).length === 0) {
    // cleared
    rows = []
  } else if (props.requests !== nextProps.requests) {
    // new request
    for (const requestId in nextProps.requests) {
      if (props.requests[requestId] == null) {
        const newRow = buildRow(nextProps.requests[requestId], nextProps.responses[requestId])
        
        if (newRow) {
          rows.push(newRow)
        }
      }
    }
  } else if (props.responses !== nextProps.responses) {
    // new response
    for (const responseId in nextProps.responses) {
      if (props.responses[responseId] == null) {
        const newRow = buildRow(nextProps.requests[responseId], nextProps.responses[responseId])
        const index = rows.findIndex(r => r.key === oc(nextProps.requests[responseId]).id(null))
        
        if (index > -1 && newRow) {
          rows[index] = newRow
        }
        
        break
      }
    }
  }
  
  rows.sort((a, b) => (String(a.sortKey) > String(b.sortKey) ? 1 : -1))
  return {
    sortedRows: rows
  }
}

class NetworkTable extends PureComponent<NetworkTableProps, NetworkTableState> {
  static ContextMenu = styled(ContextMenuComponent)({
    flex: 1
  })
  
  constructor(props:NetworkTableProps) {
    super(props)
    this.state = calculateState(
      {
        requests: {},
        responses: {}
      },
      props
    )
  }
  
  componentWillReceiveProps(nextProps:NetworkTableProps) {
    this.setState(calculateState(this.props, nextProps, this.state.sortedRows))
  }
  
  contextMenuItems = [
    {
      type: "separator"
    },
    {
      label: "Clear all",
      click: this.props.clear
    }
  ]
  
  render() {
    const
      { clear, onRowHighlighted, highlightedRows } = this.props,
      { sortedRows } = this.state
    
    return (
      <NetworkTable.ContextMenu items={this.contextMenuItems}>
        <SearchableTable
          virtual={true}
          multiline={false}
          multiHighlight={true}
          stickyBottom={true}
          floating={false}
          columnSizes={COLUMN_SIZE}
          columns={COLUMNS}
          columnOrder={COLUMN_ORDER}
          items={sortedRows}
          onRowHighlighted={onRowHighlighted}
          highlightedRows={highlightedRows}
          rowLineHeight={26}
          zebra={false}
          actions={<Button onClick={clear}>Clear Table</Button>}
        />
      </NetworkTable.ContextMenu>
    )
  }
}

const Icon = styled(Glyph)({
  marginTop: -3,
  marginRight: 3
})

class StatusColumn extends PureComponent<{
  children?:number
}> {
  render() {
    const { children } = this.props
    let glyph
    
    if (children != null && children >= 400 && children < 600) {
      glyph = <Icon name="stop" color={colors.red}/>
    }
    
    return (
      <TextEllipsis>
        {glyph}
        {children}
      </TextEllipsis>
    )
  }
}

class DurationColumn extends PureComponent<{
  request:Request,
  response:Response | null | undefined
}> {
  static Text = styled(Text)({
    flex: 1,
    textAlign: "right",
    paddingRight: 10
  })
  
  render() {
    const { request, response } = this.props
    const duration = response ? response.timestamp - request.timestamp : undefined
    return (
      <DurationColumn.Text selectable={false}>
        {duration != null ? duration.toLocaleString() + "ms" : ""}
      </DurationColumn.Text>
    )
  }
}

class SizeColumn extends PureComponent<{
  response:Response | null | undefined
}> {
  
  private static Text = styled(Text)({
    flex: 1,
    textAlign: "right",
    paddingRight: 10
  })
  
  private static getResponseLength(response:Response) {
    let length = 0
    const lengthString = response.headers ? getHeaderValue(response.headers, "content-length") : undefined
    
    if (lengthString != null && lengthString != "") {
      length = parseInt(lengthString, 10)
    } else if (response.data) {
      // FIXME: T41427687 This is probably not the correct way to determine
      // the correct byte size of the response, because String.length returns
      // the number of characters, not bytes.
      length = atob(response.data).length
    }
    
    return length
  }
  
  render() {
    const { response } = this.props
    
    if (response) {
      const text = formatBytes(SizeColumn.getResponseLength(response))
      return <SizeColumn.Text>{text}</SizeColumn.Text>
    } else {
      return null
    }
  }
  
  
}

export default {
  id: NetworkPluginComponent.id,
  type: PluginType.Normal,
  componentClazz: NetworkPluginComponent
} as PluginModuleExport<typeof NetworkPluginComponent>
