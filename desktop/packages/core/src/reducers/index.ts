/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import { combineReducers } from 'redux';
import application from './ApplicationReducer';
import connections from './ConnectionsReducer';
import pluginStates from './PluginStatesReducer';
import notifications from './NotificationsReducer';
import plugins from './PluginReducer';
import user from './UserReducer';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { State as ApplicationState, Action as ApplicationAction } from './ApplicationReducer';
import { State as DevicesState, Action as DevicesAction } from './ConnectionsReducer';
import { PluginStatesState as PluginStatesState, Action as PluginStatesAction } from './PluginStatesReducer';
import { State as NotificationsState, Action as NotificationsAction } from './NotificationsReducer';
import { State as PluginsState, Action as PluginsAction } from './PluginReducer';
import { State as UserState, Action as UserAction } from './UserReducer';
import { Store as ReduxStore, MiddlewareAPI as ReduxMiddlewareAPI } from 'redux';
export type AllActions = ApplicationAction | DevicesAction | PluginStatesAction | NotificationsAction | PluginsAction | UserAction | {
  type: "INIT";
};
export type State = {
  application: ApplicationState;
  connections: DevicesState;
  pluginStates: PluginStatesState;
  notifications: NotificationsState;
  plugins: PluginsState;
  user: UserState;
};

declare global {
  type FlipperStore = ReduxStore<RootState, AllActions>
}

export type LeafStates = ApplicationState | DevicesState | PluginsState | PluginStatesState | NotificationsState | UserState
export type RootState = State;
export type Store = FlipperStore
export type MiddlewareAPI = ReduxMiddlewareAPI<any, AllActions>;
export default combineReducers<any>({
  application,
  connections: persistReducer({
    key: 'connections',
    storage,
    whitelist: ['userPreferredDevice', 'userPreferredPlugin', 'userPreferredApp']
  }, connections),
  pluginStates,
  notifications: persistReducer({
    key: 'notifications',
    storage,
    whitelist: ['blacklistedPlugins', 'blacklistedCategories']
  }, notifications),
  plugins,
  user: persistReducer({
    key: 'user',
    storage
  }, user)
});
