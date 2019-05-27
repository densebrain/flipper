/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

//import * as ReactDOM from 'react-dom'
import {getLogger} from "@stato/common"
import {guard} from "typeguard"
import {Logger} from './fb-interfaces/Logger'
import BaseDevice from './devices/BaseDevice'
import {Plugin, PluginComponent, PluginComponentProps} from './PluginTypes'
import Client from './Client'

import {BasicThemeProps, withTheme} from "./ui/themes"
import * as React from 'react'
import {HTMLAttributes} from "react"
import {RootState, Store} from "./reducers"
import {connect} from "react-redux"
import {getPluginKey} from "./utils/pluginUtils"
import ArchivedDevice from "./devices/ArchivedDevice"
import {setPluginState} from "./reducers/PluginStatesReducer"
import {selectPlugin} from "./reducers/ConnectionsReducer"
import { activateMenuItems } from './MenuBar';
import styled from "./ui/styled"
import {ThemeProps} from "./ui/themes"
import FlexRow from "./ui/components/FlexRow"
import FlexColumn from "./ui/components/FlexColumn"
import {makeRootView} from "./ui/components/RootView"

import ErrorBoundary from "./ui/components/ErrorBoundary"
import NotificationsHub from "./NotificationsHub"

const log = getLogger(__filename)

const Container = styled(FlexColumn)(({
  theme: {
    colors
  }
}: ThemeProps) => ({
  width: 0,
  flexGrow: 1,
  flexShrink: 1,
  backgroundColor: colors.background
}));

const SidebarContainer = makeRootView(({colors}) => ({
  backgroundColor: colors.backgroundStatus,
  height: '100%',
  overflow: 'scroll'
}),FlexRow);


interface OwnProps  {
  logger: Logger
  store: Store
}

interface StateProps  {
  pluginState: Object;
  activePlugin: Plugin | undefined | null;
  target: Client | BaseDevice | null;
  pluginKey: string;
  deepLinkPayload: string | null | undefined;
  
  isArchivedDevice: boolean;
}

interface Actions {
  setPluginState: (payload: {
    pluginKey: string;
    state: Object;
  }) => void;
  selectPlugin: (payload: {
    selectedPlugin: string | null | undefined;
    selectedApp?: string | null | undefined;
    deepLinkPayload: string | null | undefined;
  }) => any;
}

interface Props extends StateProps, OwnProps, Actions, BasicThemeProps<undefined, true>, HTMLAttributes<any> {

}

const PluginContainer = withTheme()(
class extends React.Component<Props,{}> {
  
  private pluginComponent: PluginComponent | null | undefined = null
  private pluginComponentRef: PluginComponent | null | undefined// = React.createRef<PluginComponent>()
  //private pendingUpdateTimer: number | null = null
  
  private setPluginRef = (ref: PluginComponent | null) => {
    this.pluginComponentRef = ref
    
    const {activePlugin} = this.props
    if (ref && activePlugin) {
      ref.init()
      activateMenuItems(activePlugin, ref)
    }
  }
  
  constructor(props:Props, context?:any) {
    super(props, context)
  }
  
  //private initPlugin = () => guard(() => this.pluginComponent.init())
  
  private selectPlugin = (pluginID: string, deepLinkPayload: string | null | undefined) => {
    const {
      target
    } = this.props; // check if plugin will be available
  
    if (target instanceof Client && target.plugins.some(p => p === pluginID)) {
      this.props.selectPlugin({
        selectedPlugin: pluginID,
        deepLinkPayload
      });
      return true;
    } else if (target instanceof BaseDevice) {
      this.props.selectPlugin({
        selectedPlugin: pluginID,
        deepLinkPayload
      });
      return true;
    } else {
      return false;
    }
  }
  
  private makePluginComponent(): PluginComponent | null | undefined {
    const {
      pluginState,
      setPluginState,
      activePlugin,
      pluginKey,
      target,
      isArchivedDevice,
      theme,
      logger,
      store,
      deepLinkPayload
    } = this.props;
  
    if (!activePlugin || !target) {
      return null;
    }
  
    const
      {id,title,componentClazz} = activePlugin,
      {defaultPersistedState} = componentClazz,
      pluginProps: PluginComponentProps<any> = {
        id,
        title,
        store,
        key: pluginKey,
        theme,
        logger,
        persistedState: componentClazz.defaultPersistedState ?
          {
            ...defaultPersistedState,
            ...pluginState
          } :
          pluginState,
        setPersistedState: state => setPluginState({
          pluginKey,
          state
        }),
        target,
        deepLinkPayload: deepLinkPayload,
        selectPlugin: this.selectPlugin,
        ref: this.setPluginRef,
        isArchivedDevice
      }
  
    return this.pluginComponent = activePlugin.component = React.createElement(componentClazz, pluginProps) as any
    
    
  }

  componentWillReceiveProps(nextProps:Readonly<Props>, _nextContext:any):void {
    if (nextProps.activePlugin !== this.props.activePlugin) {
      const plugin = this.props.activePlugin
      if (plugin) {
        if (this.pluginComponent) {
          guard(() => this.pluginComponentRef.teardown())
    
          this.pluginComponent = null
          this.pluginComponentRef = null //React.createRef()
        }
  
        plugin.component = null
      }
      
      this.forceUpdate()
    }
  }
  
  
  render(): React.ReactNode | null {
    const {
      activePlugin,
      target,
      logger
    } = this.props;

    if (!activePlugin || !target) {
      return null;
    }
    
    
    return <>
        <Container key="plugin">
          {activePlugin &&
            <ErrorBoundary heading={`Plugin "${activePlugin.title || 'Unknown'}" encountered an error during render`} logger={logger}>
              {this.makePluginComponent()}
            </ErrorBoundary>
          }
        </Container>
        <SidebarContainer id="detailsSidebar" />
      </>;
  }

})

export default connect<StateProps, Actions, OwnProps, RootState>(({
  connections: {
    selectedPlugin,
    selectedDevice,
    selectedApp,
    clients,
    deepLinkPayload
  },
  pluginStates,
  plugins: {
    devicePlugins,
    clientPlugins
  }
}: RootState, _ownProps: OwnProps): StateProps => {
  let pluginKey = 'unknown';
  let target = null;
  let activePlugin: Plugin | null | undefined = null;

  if (selectedPlugin) {
    if (selectedPlugin === NotificationsHub.id) {
      activePlugin = NotificationsHub;
    } else if (selectedPlugin) {
      activePlugin = devicePlugins.get(selectedPlugin);
    }

    target = selectedDevice;

    if (activePlugin) {
      pluginKey = getPluginKey(selectedApp, selectedDevice, activePlugin.id);
    } else {
      target = clients.find((client: Client) => client.id === selectedApp);
      activePlugin = clientPlugins.get(selectedPlugin);

      if (!activePlugin || !target) {
        log.error(`Plugin "${selectedPlugin || ''}" could not be found.`)
      } else {
        pluginKey = getPluginKey(selectedApp, selectedDevice, activePlugin.id);
      }
    }
  }

  const isArchivedDevice = !selectedDevice ? false : selectedDevice instanceof ArchivedDevice;
  return {
    pluginState: pluginStates[pluginKey],
    activePlugin,
    target,
    deepLinkPayload,
    pluginKey,
    isArchivedDevice
  };
}, {
  setPluginState,
  selectPlugin
})(PluginContainer) as React.ComponentClass<OwnProps>;

