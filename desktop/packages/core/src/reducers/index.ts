/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import { combineReducers } from 'redux';
import application from './application';
import connections from './connections';
import pluginStates from './pluginStates';
import notifications from './notifications';
import plugins from './plugins';
import user from './user';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { State as ApplicationState, Action as ApplicationAction } from './application';
import { State as DevicesState, Action as DevicesAction } from './connections';
import { PluginStatesState as PluginStatesState, Action as PluginStatesAction } from './pluginStates';
import { State as NotificationsState, Action as NotificationsAction } from './notifications';
import { State as PluginsState, Action as PluginsAction } from './plugins';
import { State as UserState, Action as UserAction } from './user';
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
