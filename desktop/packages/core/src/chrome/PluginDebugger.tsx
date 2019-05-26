/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from "react"
import {oc} from "ts-optchain"
import Client from "../Client"
import { TableBodyRow } from "../ui/components/table/types"
import {Component, Fragment, HTMLAttributes} from "react"
import { connect } from "react-redux"

import {RootState} from "../reducers"
import styled from "../ui/styled"
import FlexColumn from "../ui/components/FlexColumn"
import {SimpleThemeProps} from "../ui/themes"
import Text from "../ui/components/Text"
import {Plugin, PluginError} from "../PluginTypes"
import Link from "../ui/components/Link"
import ManagedTable from "../ui/components/table/ManagedTable"
import Button from "../ui/components/Button"
const Container = styled(FlexColumn)({
  padding: 10,
  width: 700
})
const InfoText = styled(Text)({
  lineHeight: "130%",
  marginBottom: 8
})
const Title = styled("div")({
  fontWeight: 500,
  marginBottom: 10,
  marginTop: 8
})
const Ellipsis = styled(Text)({
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
})
const Row = styled(FlexColumn)(() => ({
  alignItems: "flex-end"
}))
const TableContainer = styled("div")(({theme:{colors}}) => ({
  borderRadius: 4,
  overflow: "hidden",
  border: `1px solid ${colors.macOSTitleBarButtonBorder}`,
  marginTop: 10,
  marginBottom: 10,
  backgroundColor: colors.white,
  height: 400,
  display: "flex"
}))

type LampProps = SimpleThemeProps & HTMLAttributes<any> & {on?:boolean}
const Lamp = styled("div")(({on,theme:{colors}}:LampProps) => ({
  width: 10,
  height: 10,
  borderRadius: 5,
  backgroundColor: on ? colors.accent : colors.error,
  border: `1px solid ${colors.border}`,
  marginTop: 6,
  flexShrink: 0
}))

type StateProps = {
  devicePlugins: Array<Plugin>,
  clientPlugins: Array<Plugin>,
  gatekeepedPlugins: Array<Plugin>,
  disabledPlugins: Array<Plugin>,
  failedPlugins: Array<PluginError>,
  clients: Array<Client>,
  selectedDevice: string | null | undefined,
}

type OwnProps = {
  onHide: () => any
}

type Props = OwnProps & StateProps

const COLUMNS = {
  lamp: {
    value: ""
  },
  name: {
    value: "Name"
  },
  status: {
    value: "Status"
  },
  gk: {
    value: "GK"
  },
  clients: {
    value: "Supported by"
  },
  source: {
    value: "Source"
  }
}
const COLUMNS_SIZES = {
  lamp: 20,
  name: "flex",
  status: 110,
  gk: 120,
  clients: 90,
  source: 140
}

class PluginDebugger extends Component<Props> {
  buildRow(
    name: string,
    loaded: boolean,
    status: string,
    GKname: string | null | undefined,
    _GKpassing: boolean | null | undefined,
    pluginPath: string | null | undefined
  ): TableBodyRow {
    return {
      key: name.toLowerCase(),
      columns: {
        lamp: {
          value: <Lamp on={loaded} />
        },
        name: {
          value: <Ellipsis>{name}</Ellipsis>
        },
        status: {
          value: status ? (
            <Ellipsis title={status} passing={false}>
              {status}
            </Ellipsis>
          ) : null
        },
        gk: {
          value: GKname && (
            <Ellipsis code title={GKname}>
              {GKname}
            </Ellipsis>
          )
        },
        clients: {
          value: this.getSupportedClients(name)
        },
        source: {
          value: pluginPath ? (
            <Ellipsis code title={pluginPath}>
              {pluginPath}
            </Ellipsis>
          ) : (
            <i>bundled</i>
          )
        }
      }
    }
  }

  getSupportedClients(id: string): string {
    return this.props.clients
      .reduce((acc: Array<string>, cv: Client) => {
        if (cv.plugins.includes(id)) {
          acc.push(cv.query.app)
        }

        return acc
      }, [])
      .join(", ")
  }

  getRows(): Array<TableBodyRow> {
    let rows: Array<TableBodyRow> = [] // bundled plugins are loaded from the defaultPlugins directory within
    // States's package.

    const externalPluginPath = (p: Plugin) =>
      p.entry ? (p.entry.startsWith("./defaultPlugins/") ? null : p.entry) : "Native Plugin"

    this.props.gatekeepedPlugins.forEach(plugin =>
      rows.push(this.buildRow(plugin.name, false, "GK disabled", plugin.gatekeeper, false, externalPluginPath(plugin)))
    )
    this.props.devicePlugins.forEach(plugin =>
      rows.push(
        this.buildRow(
          plugin.id,
          true,
          "", // $FlowFixMe: Flow doesn't know this is inherited from StatesBasePluginComponent
          plugin.gatekeeper,
          true, // $FlowFixMe: Flow doesn't know this is inherited from StatesBasePluginComponent
          externalPluginPath(plugin)
        )
      )
    )
    this.props.clientPlugins.forEach(plugin =>
      rows.push(
        this.buildRow(
          plugin.id,
          true,
          "", // $FlowFixMe: Flow doesn't know this is inherited from StatesBasePluginComponent
          plugin.gatekeeper,
          true, // $FlowFixMe: Flow doesn't know this is inherited from StatesBasePluginComponent
          externalPluginPath(plugin)
        )
      )
    )
    this.props.disabledPlugins.forEach(plugin =>
      rows.push(this.buildRow(plugin.name, false, "disabled", null, null, externalPluginPath(plugin)))
    )
    this.props.failedPlugins.forEach(([_,plugin,__, status]) =>
      rows.push(this.buildRow(plugin.name, false, status, null, null, externalPluginPath(plugin)))
    )
    return rows.sort((a, b) => (a.key < b.key ? -1 : 1))
  }

  render() {
    let content = null

    if (!this.props.selectedDevice) {
      content = (
        <InfoText>
          We can't find any device connected to your computer. Is an emulator/simulator currently running on your
          system, or is there a development device connected via USB? There are some devices/emulators known to have
          problems connecting to States. Check out the{" "}
          <Link href="https://fbstates.com/docs/troubleshooting.html#known-incompatibilities">
            known incompatibilities
          </Link>
          .
        </InfoText>
      )
    } else if (!this.props.clients.some((client: Client) => client.query.device_id === this.props.selectedDevice)) {
      // no clients for selected device
      content = (
        <Fragment>
          <InfoText>
            While States was able to connect to your device, it wasn't able to connect to the app you are running on
            your device. For this reason, app-specific plugins will not show up.
          </InfoText>
          {this.props.clients.length > 0 && ( // we have clients, but not for this device
            <InfoText>
              Make sure you selected the correct device from the dropdown button in the upper left corner. Only plugins
              for the selected device are shown in the sidebar.
            </InfoText>
          )}
          <InfoText>
            To debug why States couldn't establish a connection to the app, check out our documentation about{" "}
            <Link href="https://fbstates.com/docs/troubleshooting.html#connection-issues">connection issues</Link>.
          </InfoText>
        </Fragment>
      )
    } else {
      content = (
        <Fragment>
          <InfoText>
            The table lists all plugins known to States. Some of them might be blocked by GKs, others may not show up,
            because none of the connected apps are supporting it.
          </InfoText>
          <TableContainer>
            <ManagedTable
              columns={COLUMNS}
              items={this.getRows()}
              highlightableRows={false}
              columnSizes={COLUMNS_SIZES}
            />
          </TableContainer>
        </Fragment>
      )
    }

    return (
      <Container>
        <Title>Plugin Status</Title>
        {content}
        <Row>
          <Button compact padded onClick={this.props.onHide}>
            Close
          </Button>
        </Row>
      </Container>
    )
  }
} // $FlowFixMe

export default connect<StateProps,{},OwnProps,RootState>(
  ({
    plugins: { devicePlugins, clientPlugins, gatekeepedPlugins, disabledPlugins, failedPlugins },
    connections: { clients, selectedDevice }
  }) => ({
    devicePlugins: Array.from(devicePlugins.values()),
    clientPlugins: Array.from(clientPlugins.values()),
    gatekeepedPlugins,
    clients,
    disabledPlugins,
    failedPlugins,
    selectedDevice: oc(selectedDevice).serial(null)
  })
)(PluginDebugger)
