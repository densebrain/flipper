/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import type {ActiveSheet, LauncherMsg} from '../reducers/application';

import {
  Button,
  ButtonGroup,
  FlexRow,
  Component,
  Spacer,
  styled,
  Text,
  LoadingIndicator,
} from 'flipper';
import {connect} from 'react-redux';
import {
  setActiveSheet,
  toggleLeftSidebarVisible,
  toggleRightSidebarVisible,
  ACTIVE_SHEET_BUG_REPORTER,
} from '../reducers/application.js';
import DevicesButton from './DevicesButton.js';
import ScreenCaptureButtons from './ScreenCaptureButtons.js';
import AutoUpdateVersion from './AutoUpdateVersion.js';
import UpdateIndicator from './UpdateIndicator.js';
import config from '../fb-stubs/config.js';
import {isAutoUpdaterEnabled} from '../utils/argvUtils.js';
import isProduction from '../utils/isProduction.js';
import {styleCreator} from '../ui/styled';
import {lighten} from '@material-ui/core/styles/colorManipulator';

const AppTitleBar = styled(FlexRow)(styleCreator((props) => {
  const
    {focused,theme} = props,
    {colors} = theme;
  
  return ({
    ...theme.titlebar(props),
    height: 38,
    flexShrink: 0,
    width: '100%',
    alignItems: 'center',
    paddingLeft: 80,
    paddingRight: 10,
    justifyContent: 'space-between',
    WebkitAppRegion: 'drag',
    zIndex: 4,
  })
},['focused']));

type OwnProps = {|
  version: string,
|};

type Props = {|
  ...OwnProps,
  windowIsFocused: boolean,
  leftSidebarVisible: boolean,
  rightSidebarVisible: boolean,
  rightSidebarAvailable: boolean,
  downloadingImportData: boolean,
  toggleLeftSidebarVisible: (visible?: boolean) => void,
  toggleRightSidebarVisible: (visible?: boolean) => void,
  setActiveSheet: (sheet: ActiveSheet) => void,
  launcherMsg: LauncherMsg,
|};

const VersionText = styled(Text)(({theme}) => ({
  color: theme.colors.textStatus,
  marginLeft: 4,
  marginTop: 2,
}));

const Importing = styled(FlexRow)(({theme}) => ({
  color: theme.colors.textStatus,
  alignItems: 'center',
  marginLeft: 10,
}));

class TitleBar extends Component<Props> {
  render() {
    return (
      <AppTitleBar focused={this.props.windowIsFocused} className="toolbar">
        <DevicesButton />
        <ScreenCaptureButtons />
        {this.props.downloadingImportData && (
          <Importing>
            <LoadingIndicator size={16} />
            &nbsp;Importing data...
          </Importing>
        )}
        <Spacer />
        <VersionText>
          {this.props.version}
          {isProduction() ? '' : '-dev'}
        </VersionText>

        {isAutoUpdaterEnabled() ? (
          <AutoUpdateVersion version={this.props.version} />
        ) : (
          <UpdateIndicator launcherMsg={this.props.launcherMsg} />
        )}
        {config.bugReportButtonVisible && (
          <Button
            compact={true}
            onClick={() => this.props.setActiveSheet(ACTIVE_SHEET_BUG_REPORTER)}
            title="Report Bug"
            icon="bug"
          />
        )}
        <ButtonGroup>
          <Button
            compact={true}
            disabled={false}
            selected={this.props.leftSidebarVisible}
            onClick={() => this.props.toggleLeftSidebarVisible()}
            icon="icons/sidebar_left.svg"
            iconSize={20}
            title="Toggle Plugins"
          />
          <Button
            compact={true}
            disabled={false}
            selected={this.props.rightSidebarVisible}
            onClick={() => this.props.toggleRightSidebarVisible()}
            icon="icons/sidebar_right.svg"
            iconSize={20}
            title="Toggle Details"
            //disabled={!this.props.rightSidebarAvailable}
          />
        </ButtonGroup>
      </AppTitleBar>
    );
  }
}

export default connect<Props, OwnProps, _, _, _, _>(
  ({
    application: {
      windowIsFocused,
      leftSidebarVisible,
      rightSidebarVisible,
      rightSidebarAvailable,
      downloadingImportData,
      launcherMsg,
    },
  }) => ({
    windowIsFocused,
    leftSidebarVisible,
    rightSidebarVisible,
    rightSidebarAvailable,
    downloadingImportData,
    launcherMsg,
  }),
  {
    setActiveSheet,
    toggleLeftSidebarVisible,
    toggleRightSidebarVisible,
  },
)(TitleBar);
