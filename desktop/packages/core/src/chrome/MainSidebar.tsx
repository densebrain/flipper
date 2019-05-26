/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import config from "../fb-stubs/config"
import Client from "../Client"
import { PluginNotification } from "../reducers/NotificationsReducer"
import { ActiveSheet, setActiveSheet } from "../reducers/ApplicationReducer"
import * as React from "react"
import NotificationsHub from "../NotificationsHub"
import { selectPlugin, SelectPluginPayload } from "../reducers/ConnectionsReducer"
import UserAccount from "./UserAccount"
import { connect } from "react-redux"
import { lighten } from "@material-ui/core/styles/colorManipulator"
import { StyleDeclaration, Theme, ThemeProps, withStyles } from "../ui/themes"
import styled, { styleCreator, Transparent } from "../ui/styled"
import FlexBox from "../ui/components/FlexBox"
import Text from "../ui/components/Text"
import FlexColumn from "../ui/components/FlexColumn"
import Glyph from "../ui/components/Glyph"
import { isDevicePlugin, Plugin } from "../PluginTypes"
import LoadingIndicator from "../ui/components/LoadingIndicator"
import BaseDevice from "../devices/BaseDevice"
import { UninitializedClient } from "../UninitializedClient"
import GK from "../fb-stubs/GK"
import Sidebar from "../ui/components/Sidebar"
import { RootState } from "../reducers"
import { Run } from "../utils/runtime"
import * as _ from "lodash"

type Classes = "list"

const baseStyles = (theme: Theme): StyleDeclaration<Classes> => ({
  list: {
    backgroundColor: theme.colors.background
  }
})

const ListItem = styled("div")(
  styleCreator(({ active, theme }) => ({
    paddingLeft: 10,
    display: "flex",
    alignItems: "center",
    marginBottom: 2,
    flexShrink: 0,
    backgroundColor: active ? theme.colors.backgroundSelected : Transparent,
    color: active ? theme.colors.textSelected : theme.colors.text,
    lineHeight: "25px",
    padding: "0 10px",
    "&[disabled]": {
      color: "rgba(0, 0, 0, 0.5)"
    }
  }))
)

const SidebarHeader = styled(FlexBox, "SidebarHeader")(({ theme }) => ({
  display: "block",
  alignItems: "center",
  padding: 3,
  paddingBottom: 7,
  color: theme.colors.text, //backgroundColor: theme.colors.backgroundStatus,
  fontSize: 11,
  fontWeight: 500,
  marginLeft: 7,
  textOverflow: "ellipsis",
  overflow: "hidden",
  whiteSpace: "nowrap",
  flexShrink: 0
}))
const PluginShape = styled(FlexBox, "PluginShape")(
  styleCreator(
    props => ({
      marginRight: 5,
      backgroundColor: props.backgroundColor,
      borderRadius: 3,
      flexShrink: 0,
      width: 18,
      height: 18,
      justifyContent: "center",
      alignItems: "center"
    }),
    ["backgroundColor"]
  )
)
const PluginName = styled(Text, "PluginName")(
  styleCreator(
    props => ({
      minWidth: 0,
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      overflow: "hidden",
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      flexGrow: 1,
      fontWeight: props.isActive ? 500 : 400,
      "::after": {
        fontSize: 12,
        display: props.count ? "inline-block" : "none",
        padding: "0 8px",
        lineHeight: "17px",
        height: 17,
        alignSelf: "center",
        content: `"${props.count}"`,
        borderRadius: "999em",
        color: props.isActive
          ? props.theme.colors.textSelected
          : props.theme.colors.text,
        backgroundColor: props.isActive
          ? props.theme.colors.backgroundSelected
          : "transparent",
        fontWeight: props.isActive ? 700 : 400
      }
    }),
    ["isActive", "count"]
  )
)
const Plugins = styled(FlexColumn, "Plugins")(() => ({
  flexGrow: 1,
  overflow: "auto"
}))
//const DevicePluginsContainer = styled(FlexColumn, 'DevicePluginsContainer')({});
const PluginDebugger = styled(FlexBox, "PluginDebugger")(
  ({ theme: { colors } }) => ({
    color: colors.text,
    alignItems: "center",
    padding: 10,
    flexShrink: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  })
)

type PluginIconProps = {
  isActive: boolean
  backgroundColor?: string
  name: string
  color: string
  theme: Theme
  classes: StyleDeclaration<string>
}

const PluginIcon = withStyles(baseStyles, {
  withTheme: true
})(({ backgroundColor, name, color }: PluginIconProps) =>
    <PluginShape backgroundColor={backgroundColor}>
      <Glyph size={12} name={name} color={color} />
    </PluginShape>
  )

type PluginSidebarListItemProps = {
  onClick: () => void
  isActive: boolean
  plugin: Plugin
  app?: string | null | undefined
  theme: Theme
  classes: StyleDeclaration<Classes>
}

const PluginSidebarListItem = withStyles(baseStyles, {
  withTheme: true,
  name: "PluginSidebarListItem"
})((props: PluginSidebarListItemProps) => {
  const { isActive, plugin, theme, app = "Facebook" } = props,
    { getContrastText, plugin: pluginTheme } = theme,
    iconColor =
      pluginTheme.colors[parseInt(app, 36) % pluginTheme.colors.length]

  return (
    <ListItem active={isActive} onClick={props.onClick}>
      <PluginIcon
        isActive={isActive}
        name={plugin.icon || "apps"}
        backgroundColor={iconColor}
        color={getContrastText(iconColor)}
      />
      <PluginName isActive={isActive}>{plugin.title || plugin.id}</PluginName>
    </ListItem>
  )
})

const Spinner = centerInSidebar(LoadingIndicator)

const ErrorIndicator = centerInSidebar(Glyph)

function centerInSidebar(component: React.ComponentType<any>) {
  return styled(component)({
    marginTop: "10px",
    marginBottom: "10px",
    marginLeft: "auto",
    marginRight: "auto"
  })
}

type StateProps = {
  selectedPlugin: string | null | undefined
  selectedApp: string | null | undefined
  selectedDevice: BaseDevice | null | undefined
  windowIsFocused: boolean
  clients: Array<Client>
  uninitializedClients: Array<{
    client: UninitializedClient
    deviceId?: string
    errorMessage?: string
  }>
  numNotifications: number
  devicePlugins: Map<string, Plugin>
  clientPlugins: Map<string, Plugin>
}

type Actions = {
  selectPlugin: (payload: SelectPluginPayload) => void
  setActiveSheet: (activeSheet: ActiveSheet) => void
}

type MainSidebarProps = ThemeProps<StateProps & Actions, Classes, true>

const MainSidebar = withStyles(baseStyles, {
  withTheme: true,
  name: "MainSidebar"
})(
  class MainSidebar extends React.PureComponent<MainSidebarProps> {
    private makeOnSelectPlugin = _.memoize((pluginId: string) => () =>
      this.props.selectPlugin({
        selectedPlugin: pluginId,
        selectedApp: null,
        deepLinkPayload: null
      })
    )

    render() {
      const {
        selectedDevice,
        selectedPlugin,
        selectedApp,
        selectPlugin,
        classes,
        numNotifications,
        theme: { colors }
      } = this.props // ((this.props : any) : ThemedProps<MainSidebarProps>);

      let { clients, uninitializedClients, devicePlugins } = this.props

      clients = clients
        .filter(
          (client: Client) =>
            selectedDevice && selectedDevice.supportsOS(client.query.os)
        )
        .sort((a, b) => (a.query.app || "").localeCompare(b.query.app))

      const byPluginNameOrId = (a: Plugin, b: Plugin) =>
        (a.title || a.id) > (b.title || b.id) ? 1 : -1

      return (
        <Sidebar
          backgroundColor={lighten(colors.background, 0.1)}
          position="left"
          width={200}
        >
          <Plugins>
            {!GK.get("states_disable_notifications") && (
              <ListItem
                active={selectedPlugin === "notifications"}
                onClick={this.makeOnSelectPlugin("notifications")}
              >
                <PluginIcon
                  color={colors.text}
                  name={
                    numNotifications > 0
                      ? NotificationsHub.icon || "bell"
                      : "bell-null"
                  }
                  isActive={selectedPlugin === NotificationsHub.id}
                />
                <PluginName
                  count={numNotifications}
                  isActive={selectedPlugin === NotificationsHub.id}
                >
                  {NotificationsHub.title}
                </PluginName>
              </ListItem>
            )}
            {selectedDevice && (
              <>
                <SidebarHeader>{selectedDevice.title}</SidebarHeader>
                <FlexColumn className={classes.list}>
                  {Array.from(devicePlugins.values())
                    .filter(
                      plugin =>
                        isDevicePlugin(plugin) &&
                        plugin.componentClazz.supportsDevice(selectedDevice)
                    )
                    .sort(byPluginNameOrId)
                    .map((plugin: Plugin) => (
                      <PluginSidebarListItem
                        key={plugin.id}
                        isActive={plugin.id === selectedPlugin}
                        onClick={() =>
                          selectPlugin({
                            selectedPlugin: plugin.id,
                            selectedApp: null,
                            deepLinkPayload: null
                          })
                        }
                        plugin={plugin}
                      />
                    ))}
                </FlexColumn>
              </>
            )}
            {clients
              .filter(
                (client: Client) =>
                  (selectedDevice &&
                    client.query.device_id === selectedDevice.serial) || // Old android sdk versions don't know their
                  // device_id
                  // Display their plugins under all selected devices until they die out
                  client.query.device_id === "unknown"
              )
              .map((client: Client) => (
                <React.Fragment key={client.id}>
                  <SidebarHeader>{client.query.app}</SidebarHeader>
                  {Array.from(this.props.clientPlugins.values())
                    .filter((p: Plugin) => client.plugins.indexOf(p.id) > -1)
                    .sort(byPluginNameOrId)
                    .map((plugin: Plugin) => (
                      <PluginSidebarListItem
                        key={plugin.id}
                        isActive={
                          plugin.id === selectedPlugin &&
                          selectedApp === client.id
                        }
                        onClick={() =>
                          selectPlugin({
                            selectedPlugin: plugin.id,
                            selectedApp: client.id,
                            deepLinkPayload: null
                          })
                        }
                        plugin={plugin}
                        app={client.query.app}
                      />
                    ))}
                </React.Fragment>
              ))}
            {uninitializedClients.map(entry => (
              <React.Fragment key={JSON.stringify(entry.client)}>
                <SidebarHeader>{entry.client.appName}</SidebarHeader>
                {entry.errorMessage ? (
                  <ErrorIndicator name={"mobile-cross"} size={16} />
                ) : (
                  <Spinner size={16} />
                )}
              </React.Fragment>
            ))}
          </Plugins>
          <PluginDebugger
            onClick={() => this.props.setActiveSheet("PLUGIN_DEBUGGER")}
          >
            <Glyph
              name="question-circle"
              size={16}
              variant="outline"
              color={colors.textStatus}
            />
            &nbsp;Plugin not showing?
          </PluginDebugger>
          {config.showLogin && <UserAccount />}
        </Sidebar>
      )
    }
  }
)
export default connect<StateProps, Actions, {}, RootState>(
  ({
    application: { windowIsFocused },
    connections: {
      selectedDevice,
      selectedPlugin,
      selectedApp,
      clients,
      uninitializedClients
    },
    notifications: { activeNotifications, blacklistedPlugins },
    plugins: { devicePlugins, clientPlugins }
  }) => ({
    numNotifications: Run(() => {
      const blacklist = new Set(blacklistedPlugins)
      return activeNotifications.filter(
        (n: PluginNotification) => !blacklist.has(n.pluginId)
      ).length
    }),
    windowIsFocused,
    selectedDevice,
    selectedPlugin,
    selectedApp,
    clients,
    uninitializedClients,
    devicePlugins,
    clientPlugins
  }),
  {
    selectPlugin,
    setActiveSheet
  }
)(MainSidebar)
