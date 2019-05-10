/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import {FlipperBasePlugin} from '../plugin.js';
import config from '../fb-stubs/config';
import type BaseDevice from '../devices/BaseDevice.js';
import type Client from '../Client.js';
import type {UninitializedClient} from '../UninitializedClient.js';
import type {PluginNotification} from '../reducers/notifications';
import type {ActiveSheet} from '../reducers/application';
import type {
  Theme,
  Colors,
  ThemedProps,
  ThemedClassesProps,
  StyleDeclaration,
} from 'flipper';
import {
  PureComponent,
  Component,
  Sidebar,
  FlexBox,
  Themes,
  Text,
  Glyph,
  styled,
  styleCreator,
  FlexColumn,
  GK,
  FlipperPlugin,
  FlipperDevicePlugin,
  LoadingIndicator,
  withStyles,
  Transparent,
} from 'flipper';
import React from 'react';
import NotificationsHub from '../NotificationsHub.js';
import {selectPlugin} from '../reducers/connections.js';
import {setActiveSheet} from '../reducers/application.js';
import UserAccount from './UserAccount.js';
import {connect} from 'react-redux';
import type {CSSProperties} from '@material-ui/styles/withStyles';
import {lighten} from '@material-ui/core/styles/colorManipulator';

type Classes = 'list'

const baseStyles = (theme: Theme): StyleDeclaration<Classes> => ({
  list: {
    backgroundColor: theme.colors.background,
  },
});

const ListItem = styled('div')(styleCreator(({active, theme}) => ({
  paddingLeft: 10,
  display: 'flex',
  alignItems: 'center',
  marginBottom: 2,
  flexShrink: 0,
  backgroundColor: active ? theme.colors.backgroundSelected : Transparent,
  color: active ? theme.colors.textSelected : theme.colors.text,
  lineHeight: '25px',
  padding: '0 10px',
  '&[disabled]': {
    color: 'rgba(0, 0, 0, 0.5)',
  },
}), ['active', 'isActive']));


const SidebarHeader = styled(FlexBox, 'SidebarHeader')(({theme}) => ({
  display: 'block',
  alignItems: 'center',
  padding: 3,
  paddingBottom: 7,
  color: theme.colors.text,
  //backgroundColor: theme.colors.backgroundStatus,
  fontSize: 11,
  fontWeight: 500,
  marginLeft: 7,
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  flexShrink: 0,
}));

const PluginShape = styled(FlexBox, 'PluginShape')(styleCreator(props => ({
  marginRight: 5,
  backgroundColor: props.backgroundColor,
  borderRadius: 3,
  flexShrink: 0,
  width: 18,
  height: 18,
  justifyContent: 'center',
  alignItems: 'center',
}), ['backgroundColor']));

const PluginName = styled(Text, 'PluginName')(styleCreator(props => ({
  minWidth: 0,
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  flexGrow: 1,
  fontWeight: props.isActive ? 500 : 400,
  '::after': {
    fontSize: 12,
    display: props.count ? 'inline-block' : 'none',
    padding: '0 8px',
    lineHeight: '17px',
    height: 17,
    alignSelf: 'center',
    content: `"${props.count}"`,
    borderRadius: '999em',
    color: props.isActive ? props.theme.colors.textSelected : props.theme.colors.text,
    backgroundColor: props.isActive
      ? props.theme.colors.backgroundSelected
      : 'transparent',
    fontWeight: props.isActive ? 700 : 400,
  },
}), ['isActive', 'count']));

const Plugins = styled(FlexColumn, 'Plugins')(({theme}) => ({
  flexGrow: 1,
  overflow: 'auto',
}));

const DevicePluginsContainer = styled(FlexColumn, 'DevicePluginsContainer')({});

const PluginDebugger = styled(FlexBox, 'PluginDebugger')(({theme: {colors}}) => ({
  color: colors.text,
  alignItems: 'center',
  padding: 10,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));


const PluginIcon = withStyles<any, string>(baseStyles, {withTheme: true})(
  ({
     isActive,
     backgroundColor,
     name,
     color,
     theme,
     classes,
   }: {
    isActive: boolean,
    backgroundColor?: string,
    name: string,
    color: string,
    theme: Theme,
    classes: StyleDeclaration<string>
  }): any => {
    return (
      <PluginShape backgroundColor={backgroundColor}>
        <Glyph size={12} name={name} color={color}/>
      </PluginShape>
    );
  });

type PluginSidebarListItemProps = {|
  onClick: () => void,
  isActive: boolean,
  plugin: Class<FlipperBasePlugin<>>,
  app?: ?string,
  theme: Theme,
  classes: StyleDeclaration<Classes>
|};

const PluginSidebarListItem = withStyles<PluginSidebarListItemProps, Classes>(baseStyles, {withTheme: true})(
  class extends Component<PluginSidebarListItemProps> {
    render() {
      const {isActive, plugin, theme} = this.props;
      const
        app = this.props.app || 'Facebook',
        {colors, getContrastText, plugin: pluginTheme} = theme,
        iconColor = pluginTheme.colors[parseInt(app, 36) % pluginTheme.colors.length];
      
      
      return (
        <ListItem active={isActive} onClick={this.props.onClick}>
          <PluginIcon
            isActive={isActive}
            name={plugin.icon || 'apps'}
            backgroundColor={iconColor}
            color={getContrastText(iconColor)}
          />
          <PluginName isActive={isActive}>{plugin.title || plugin.id}</PluginName>
        </ListItem>
      );
    }
  });

const Spinner = centerInSidebar(LoadingIndicator);

const ErrorIndicator = centerInSidebar(Glyph);

function centerInSidebar(component) {
  return styled(component)({
    marginTop: '10px',
    marginBottom: '10px',
    marginLeft: 'auto',
    marginRight: 'auto',
  });
}

type MainSidebarProps = ThemedClassesProps<{
  selectedPlugin: ?string,
  selectedApp: ?string,
  //theme: Theme,
  selectedDevice: ?BaseDevice,
  windowIsFocused: boolean,
  selectPlugin: (payload: {|
    selectedPlugin: ?string,
    selectedApp: ?string,
    deepLinkPayload: ?string,
  |}) => void,
  clients: Array<Client>,
  uninitializedClients: Array<{
    client: UninitializedClient,
    deviceId?: string,
    errorMessage?: string,
  }>,
  numNotifications: number,
  devicePlugins: Map<string, Class<FlipperDevicePlugin<>>>,
  clientPlugins: Map<string, Class<FlipperPlugin<>>>,
  setActiveSheet: (activeSheet: ActiveSheet) => void,
},Classes>;


const MainSidebar = withStyles<MainSidebarProps, Classes>(baseStyles, {withTheme: true})(class extends React.PureComponent<MainSidebarProps> {
  render() {
    const {
      selectedDevice,
      selectedPlugin,
      selectedApp,
      selectPlugin,
      classes,
      windowIsFocused,
      numNotifications,
      theme: {colors},
    } = this.props;// ((this.props : any) : ThemedProps<MainSidebarProps>);
    let {clients, uninitializedClients} = this.props;
    clients = clients
      .filter(
        (client: Client) =>
          selectedDevice && selectedDevice.supportsOS(client.query.os),
      )
      .sort((a, b) => (a.query.app || '').localeCompare(b.query.app));
    
    const byPluginNameOrId = (a, b) =>
      (a.title || a.id) > (b.title || b.id) ? 1 : -1;
    
    return (
      <Sidebar
        backgroundColor={lighten(colors.background, 0.1)}
        position="left"
        width={200}
      >
        <Plugins>
          {!GK.get('flipper_disable_notifications') && (
            <ListItem
              active={selectedPlugin === 'notifications'}
              onClick={() =>
                selectPlugin({
                  selectedPlugin: 'notifications',
                  selectedApp: null,
                  deepLinkPayload: null,
                })
              }>
              <PluginIcon
                color={colors.text}
                name={
                  numNotifications > 0
                    ? NotificationsHub.icon || 'bell'
                    : 'bell-null'
                }
                isActive={selectedPlugin === NotificationsHub.id}
              />
              <PluginName
                count={numNotifications}
                isActive={selectedPlugin === NotificationsHub.id}>
                {NotificationsHub.title}
              </PluginName>
            </ListItem>
          )}
          {selectedDevice && (
            <SidebarHeader>{selectedDevice.title}</SidebarHeader>
          )}
          {selectedDevice && <FlexColumn className={classes.list}>
            {
              Array.from(this.props.devicePlugins.values())
                .filter(plugin => plugin.supportsDevice(selectedDevice))
                .sort(byPluginNameOrId)
                .map((plugin: Class<FlipperDevicePlugin<>>) => (
                  <PluginSidebarListItem
                    key={plugin.id}
                    isActive={plugin.id === selectedPlugin}
                    onClick={() =>
                      selectPlugin({
                        selectedPlugin: plugin.id,
                        selectedApp: null,
                        deepLinkPayload: null,
                      })
                    }
                    plugin={plugin}
                  />
                ))
            }
          </FlexColumn>
          }
          {clients
            .filter(
              (client: Client) =>
                (selectedDevice &&
                  client.query.device_id === selectedDevice.serial) ||
                // Old android sdk versions don't know their device_id
                // Display their plugins under all selected devices until they die out
                client.query.device_id === 'unknown',
            )
            .map((client: Client) => (
              <React.Fragment key={client.id}>
                <SidebarHeader>{client.query.app}</SidebarHeader>
                {Array.from(this.props.clientPlugins.values())
                  .filter(
                    (p: Class<FlipperPlugin<>>) =>
                      client.plugins.indexOf(p.id) > -1,
                  )
                  .sort(byPluginNameOrId)
                  .map((plugin: Class<FlipperPlugin<>>) => (
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
                          deepLinkPayload: null,
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
                <ErrorIndicator name={'mobile-cross'} size={16}/>
              ) : (
                <Spinner size={16}/>
              )}
            </React.Fragment>
          ))}
        </Plugins>
        <PluginDebugger
          onClick={() => this.props.setActiveSheet('PLUGIN_DEBUGGER')}>
          <Glyph
            name="question-circle"
            size={16}
            variant="outline"
            color={colors.textStatus}
          />
          &nbsp;Plugin not showing?
        </PluginDebugger>
        {config.showLogin && <UserAccount/>}
      </Sidebar>
    );
  }
});

export default connect<MainSidebarProps, {||}, _, _, _, _>(
  ({
     application: {windowIsFocused},
     connections: {
       selectedDevice,
       selectedPlugin,
       selectedApp,
       clients,
       uninitializedClients,
     },
     notifications: {activeNotifications, blacklistedPlugins},
     plugins: {devicePlugins, clientPlugins},
   }) => ({
    numNotifications: (() => {
      const blacklist = new Set(blacklistedPlugins);
      return activeNotifications.filter(
        (n: PluginNotification) => !blacklist.has(n.pluginId),
      ).length;
    })(),
    windowIsFocused,
    selectedDevice,
    selectedPlugin,
    selectedApp,
    clients,
    uninitializedClients,
    devicePlugins,
    clientPlugins,
  }),
  {
    selectPlugin,
    setActiveSheet,
  },
)(MainSidebar);
