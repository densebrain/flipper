/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import {DevicePlugin, Plugin} from './PluginTypes'
import {PluginNotification} from './reducers/notifications'
import {Notification} from "./PluginTypes"
import {Logger} from './fb-interfaces/Logger'
// import {
//   FlipperDevicePlugin,
//   Searchable,
//   Button,
//   ButtonGroup,
//   FlexBox,
//   FlexColumn,
//   FlexRow,
//   Glyph,
//   ContextMenu,
//   styled,
//   colors
// } from 'flipper'
import {connect} from 'react-redux'
import {Component, Fragment} from 'react'
import * as React from 'react'
import {clipboard, MenuItemConstructorOptions} from 'electron'

import {clearAllNotifications, updatePluginBlacklist, updateCategoryBlacklist} from './reducers/notifications'
import {selectPlugin} from './reducers/connections'
import {textContent} from './utils/index'
import createPaste from './fb-stubs/createPaste'
import Device from "./devices/BaseDevice"
import {KeyboardActions} from "./KeyboardTypes"

import {FlipperDevicePlugin} from "./plugin"
import Button from "./ui/components/Button"
import {Filter} from "./ui"
import styled from "./ui/styled"
import FlexColumn from "./ui/components/FlexColumn"
import {makeRootView} from "./ui/components/RootView"
import FlexBox from "./ui/components/FlexBox"
import ContextMenu from "./ui/components/ContextMenu"


export default class Notifications extends FlipperDevicePlugin<{}> {
  
  static supportsDevice(_device:Device) {
    return false
  }
  
  id = 'notifications'
  title = 'Notifications'
  icon = 'bell'
  keyboardActions:KeyboardActions = ['clear']
  
  
  onKeyboardAction = (action:string) => {
    if (action === 'clear') {
      this.onClear()
    }
  }
  onClear = () => {
    this.context.store.dispatch(clearAllNotifications())
  }
  
  render() {
    
    const
      {store, deepLinkPayload, selectPlugin, logger} = this.props,
      {
        blacklistedPlugins,
        blacklistedCategories
      } = store.getState().notifications
    
    return <ConnectedNotificationsTable
      onClear={this.onClear}
      selectedID={deepLinkPayload} onSelectPlugin={selectPlugin} logger={logger}
      defaultFilters={[...blacklistedPlugins.map(value => ({
        value,
        invertible: false,
        type: 'exclude',
        key: 'plugin'
      })), ...blacklistedCategories.map(value => ({
        value,
        invertible: false,
        type: 'exclude',
        key: 'category'
      }))]} actions={<Fragment>
      <Button onClick={this.onClear}>Clear</Button>
    </Fragment>}/>
  }
  
}
type OwnProps = {
  onClear:() => void;
  selectedID:string | null | undefined;
  logger:Logger;
};
type Props = {
  activeNotifications:Array<PluginNotification>;
  invalidatedNotifications:Array<PluginNotification>;
  blacklistedPlugins:Array<string>;
  blacklistedCategories:Array<string>;
  devicePlugins:Map<string, DevicePlugin>;
  clientPlugins:Map<string, Plugin>;
  updatePluginBlacklist:(blacklist:Array<string>) => any;
  updateCategoryBlacklist:(blacklist:Array<string>) => any;
  filters: Array<Filter>
  selectPlugin:(payload:{
    selectedPlugin:string | null | undefined;
    selectedApp:string | null | undefined;
    deepLinkPayload:string | null | undefined;
  }) => any;
};
type State = {
  selectedNotification:string | null | undefined;
};
const Content = makeRootView(({colors}) => ({
  padding: '0 10px',
  backgroundColor: colors.backgroundStatus,
  overflow: 'scroll',
  flexGrow: 1
}), FlexColumn)
const Heading = makeRootView(({colors}) => ({
  display: 'block',
  alignItems: 'center',
  marginTop: 15,
  marginBottom: 5,
  color: colors.text,
  fontSize: 11,
  fontWeight: 500,
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  flexShrink: 0
}),FlexBox)
const NoContent = makeRootView(({colors}) => ({
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
  flexGrow: 1,
  fontWeight: 500,
  lineHeight: 2.5,
  color: colors.textStatus
}), FlexColumn)

class NotificationsTable extends Component<Props & OwnProps, State> {
  contextMenuItems = [{
    label: 'Clear all',
    click: this.props.onClear
  }]
  state:State = {
    selectedNotification: this.props.selectedID
  }
  
  componentDidUpdate(prevProps:Props & OwnProps) {
    const {filters, updatePluginBlacklist, updateCategoryBlacklist} = this.props
    if (filters.length !== prevProps.filters.length) {
      updatePluginBlacklist(filters.filter(f => f.type === 'exclude' && f.key.toLowerCase() === 'plugin').map(f => String(f.value)))
      updateCategoryBlacklist(filters.filter(f => f.type === 'exclude' && f.key.toLowerCase() === 'category').map(f => String(f.value)))
    }
    
    if (this.props.selectedID && prevProps.selectedID !== this.props.selectedID) {
      this.setState({
        selectedNotification: this.props.selectedID
      })
    }
  }
  
  onHidePlugin = (pluginId:string) => {
    // add filter to searchbar
    this.props.addFilter({
      value: pluginId,
      type: 'exclude',
      key: 'plugin',
      invertible: false
    })
    this.props.updatePluginBlacklist(this.props.blacklistedPlugins.concat(pluginId))
  }
  onHideCategory = (category:string) => {
    // add filter to searchbar
    this.props.addFilter({
      value: category,
      type: 'exclude',
      key: 'category',
      invertible: false
    })
    this.props.updatePluginBlacklist(this.props.blacklistedCategories.concat(category))
  }
  getFilter = ():(n:PluginNotification) => boolean => (n:PluginNotification) => {
    const searchTerm = this.props.searchTerm.toLowerCase() // filter plugins
    
    const blacklistedPlugins = new Set(this.props.blacklistedPlugins.map(p => p.toLowerCase()))
    
    if (blacklistedPlugins.has(n.pluginId.toLowerCase())) {
      return false
    } // filter categories
    
    
    const {
      category
    } = n.notification
    
    if (category) {
      const blacklistedCategories = new Set(this.props.blacklistedCategories.map(p => p.toLowerCase()))
      
      if (blacklistedCategories.has(category.toLowerCase())) {
        return false
      }
    }
    
    if (searchTerm.length === 0) {
      return true
    } else if (n.notification.title.toLowerCase().indexOf(searchTerm) > -1) {
      return true
    } else if (typeof n.notification.message === 'string' && n.notification.message.toLowerCase().indexOf(searchTerm) > -1) {
      return true
    }
    
    return false
  }
  getPlugin = (id:string) => this.props.clientPlugins.get(id) || this.props.devicePlugins.get(id)
  
  render() {
    const
      {logger, selectPlugin, onClear, activeNotifications, invalidatedNotifications} = this.props,
      activeItems = activeNotifications.filter(this.getFilter()).map((n:PluginNotification) => {
      const {
        category
      } = n.notification
      return <NotificationItem
        key={n.notification.id}
        notification={n}
        {...n}
        plugin={this.getPlugin(n.pluginId)}
        isSelected={this.state.selectedNotification === n.notification.id}
        onHighlight={() => this.setState({
          selectedNotification: n.notification.id
        })}
        onClear={onClear}
        onHidePlugin={() => this.onHidePlugin(n.pluginId)}
        onHideCategory={category ? () => this.onHideCategory(category) : undefined}
        selectPlugin={selectPlugin} logger={logger}/>
    }).reverse(),
      invalidatedItems = invalidatedNotifications.filter(this.getFilter()).map((n:PluginNotification) =>
    
      <NotificationItem
        key={n.notification.id} {...n}
        notification={n}
        plugin={this.getPlugin(n.pluginId)}
        onClear={onClear}
        inactive
      />).reverse()
    return <ContextMenu items={this.contextMenuItems} component={Content}>
      {activeNotifications.length > 0 && <Fragment>
        <Heading>Active notifications</Heading>
        <FlexColumn shrink={false}>{activeNotifications}</FlexColumn>
      </Fragment>}
      {invalidatedNotifications.length > 0 && <Fragment>
        <Heading>Past notifications</Heading>
        <FlexColumn shrink={false}>{invalidatedNotifications}</FlexColumn>
      </Fragment>}
      {activeNotifications.length + invalidatedNotifications.length === 0 && <NoContent>
        <Glyph name="bell-null" size={24} variant="outline" color={colors.light30}/>
        No Notifications
      </NoContent>}
    </ContextMenu>
  }
  
}

const ConnectedNotificationsTable = connect<Props, OwnProps, _, _, _, _>(({
                                                                            notifications: {
                                                                              activeNotifications,
                                                                              invalidatedNotifications,
                                                                              blacklistedPlugins,
                                                                              blacklistedCategories
                                                                            },
                                                                            plugins: {
                                                                              devicePlugins,
                                                                              clientPlugins
                                                                            }
                                                                          }) => ({
  activeNotifications,
  invalidatedNotifications,
  blacklistedPlugins,
  blacklistedCategories,
  devicePlugins,
  clientPlugins
}), {
  updatePluginBlacklist,
  updateCategoryBlacklist,
  selectPlugin
})(Searchable(NotificationsTable))

const shadow = (props, hover) => {
  if (props.inactive) {
    return `inset 0 0 0 1px ${colors.light10}`
  }
  
  let shadow = ['1px 1px 5px rgba(0,0,0,0.1)']
  
  if (props.isSelected) {
    shadow.push(`inset 0 0 0 2px ${colors.macOSTitleBarIconSelected}`)
  }
  
  return shadow.join(',')
}

const SEVERITY_COLOR_MAP = {
  warning: colors.yellow,
  error: colors.red
}
const NotificationBox = styled(FlexRow)(props => ({
  backgroundColor: props.inactive ? 'transparent' : colors.white,
  opacity: props.inactive ? 0.5 : 1,
  alignItems: 'flex-start',
  borderRadius: 5,
  padding: 10,
  flexShrink: 0,
  overflow: 'hidden',
  position: 'relative',
  marginBottom: 10,
  boxShadow: shadow(props),
  '::before': {
    content: '""',
    display: !props.inactive && !props.isSelected ? 'block' : 'none',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: SEVERITY_COLOR_MAP[props.severity] || colors.info
  },
  ':hover': {
    boxShadow: shadow(props, true),
    '& > *': {
      opacity: 1
    }
  }
}))
const Title = styled('div')({
  minWidth: 150,
  color: colors.light80,
  flexShrink: 0,
  marginBottom: 6,
  fontWeight: 500,
  lineHeight: 1,
  fontSize: '1.1em'
})
const NotificationContent = styled(FlexColumn)(props => ({
  marginLeft: 6,
  marginRight: 10,
  flexGrow: 1,
  overflow: 'hidden',
  maxHeight: props.isSelected ? 'none' : 56,
  lineHeight: 1.4,
  color: props.isSelected ? colors.light50 : colors.light30
}))
const Actions = styled(FlexRow)({
  alignItems: 'center',
  justifyContent: 'space-between',
  color: colors.light20,
  marginTop: 12,
  borderTop: `1px solid ${colors.light05}`,
  paddingTop: 8
})
const NotificationButton = styled('div')({
  border: `1px solid ${colors.light20}`,
  color: colors.light50,
  borderRadius: 4,
  textAlign: 'center',
  padding: 4,
  width: 80,
  marginBottom: 4,
  opacity: 0,
  transition: '0.15s opacity',
  '[data-role="notification"]:hover &': {
    opacity: 0.5
  },
  ':last-child': {
    marginBottom: 0
  },
  '[data-role="notification"] &:hover': {
    opacity: 1
  }
})
type ItemProps = {
  onClear:() => void
  notification: Notification
  onHighlight?:() => any;
  onHidePlugin?:() => any;
  onHideCategory?:() => any;
  isSelected?:boolean;
  inactive?:boolean;
  selectPlugin?:(payload:{
    selectedPlugin:string | null | undefined;
    selectedApp:string | null | undefined;
    deepLinkPayload:string | null | undefined;
  }) => any;
  logger?:Logger;
  plugin:Plugin | null | undefined;
};
type ItemState = {
  reportedNotHelpful:boolean;
};

class NotificationItem extends Component<ItemProps, ItemState> {
  constructor(props:ItemProps) {
    super(props)
    const items:MenuItemConstructorOptions[] = []
    
    if (props.onHidePlugin && props.plugin) {
      items.push({
        label: `Hide ${props.plugin.title || props.plugin.id} plugin`,
        click: this.props.onHidePlugin
      })
    }
    
    if (props.onHideCategory) {
      items.push({
        label: 'Hide Similar',
        click: this.props.onHideCategory
      })
    }
    
    items.push({
      label: 'Copy',
      click: this.copy
    }, {
      label: 'Create Paste',
      click: this.createPaste
    })
    this.contextMenuItems = items
  }
  
  state = {
    reportedNotHelpful: false
  }
  
  contextMenuItems = Array<MenuItemConstructorOptions>()
  
  deepLinkButton = React.createRef()
  createPaste = () => {
    createPaste(this.getContent())
  }
  copy = () => clipboard.writeText(this.getContent())
  getContent = ():string => {
    const {notification} = this.props
    return  [notification.timestamp, `[${notification.severity}] ${notification.title}`, notification.action, notification.category, textContent(notification.message)].filter(Boolean).join('\n')
  }
  openDeeplink = () => {
    const {
      notification,
      pluginId,
      client
    } = this.props
    
    if (this.props.selectPlugin && notification.action) {
      this.props.selectPlugin({
        selectedPlugin: pluginId,
        selectedApp: client,
        deepLinkPayload: notification.action
      })
    }
  }
  reportNotUseful = (e:UIEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (this.props.logger) {
      this.props.logger.track('usage', 'notification-not-useful', this.props.notification)
    }
    
    this.setState({
      reportedNotHelpful: true
    })
  }
  onHide = (e:UIEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (this.props.onHideCategory) {
      this.props.onHideCategory()
    } else if (this.props.onHidePlugin) {
      this.props.onHidePlugin()
    }
  }
  
  render() {
    const {
      notification,
      isSelected,
      inactive,
      onHidePlugin,
      onHideCategory,
      plugin
    } = this.props
    const {
      action
    } = notification
    return <ContextMenu data-role="notification" component={NotificationBox} severity={notification.severity}
                        onClick={this.props.onHighlight} isSelected={isSelected} inactive={inactive}
                        items={this.contextMenuItems}>
      <Glyph name={plugin?.icon || 'bell'} size={12}/>
      <NotificationContent isSelected={isSelected}>
        <Title>{notification.title}</Title>
        {notification.message}
        {!inactive && isSelected && plugin && (action || onHidePlugin || onHideCategory) && <Actions>
          <FlexRow>
            {action && <Button onClick={this.openDeeplink}>
              Open in {plugin.title}
            </Button>}
            <ButtonGroup>
              {onHideCategory && <Button onClick={onHideCategory}>Hide similar</Button>}
              {onHidePlugin && <Button onClick={onHidePlugin}>
                Hide {plugin.title}
              </Button>}
            </ButtonGroup>
          </FlexRow>
          <span>
                  {notification.timestamp ? new Date(notification.timestamp).toTimeString() : ''}
                </span>
        </Actions>}
      </NotificationContent>
      {action && !inactive && !isSelected && <FlexColumn style={{
        alignSelf: 'center'
      }}>
        {action && <NotificationButton compact onClick={this.openDeeplink}>
          Open
        </NotificationButton>}
        {this.state.reportedNotHelpful ? <NotificationButton compact onClick={this.onHide}>
          Hide
        </NotificationButton> : <NotificationButton compact onClick={this.reportNotUseful}>
          Not helpful
        </NotificationButton>}
      </FlexColumn>}
    </ContextMenu>
  }
  
}
