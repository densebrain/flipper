/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from "react"
import { ActiveSheet, LauncherMsg } from '../reducers/application';
import { connect } from 'react-redux';
import { setActiveSheet, toggleLeftSidebarVisible, toggleRightSidebarVisible, ACTIVE_SHEET_BUG_REPORTER } from '../reducers/application';
import DevicesButton from './DevicesButton';
import ScreenCaptureButtons from './ScreenCaptureButtons';
import AutoUpdateVersion from './AutoUpdateVersion';
import UpdateIndicator from './UpdateIndicator';
import config from '../fb-stubs/config';
import { isAutoUpdaterEnabled } from '../utils/argvUtils';
import isProduction from '../utils/isProduction';
import styled, { styleCreator } from '../ui/styled';
import FlexRow from "../ui/components/FlexRow"
import {SimpleThemeProps} from "../ui/themes"
import {HTMLAttributes} from "react"
import Text from "../ui/components/Text"
import LoadingIndicator from "../ui/components/LoadingIndicator"
import {Spacer} from "../ui/components/Toolbar"
import Button from "../ui/components/Button"
import ButtonGroup from "../ui/components/ButtonGroup"
import {RootState} from "../reducers"

type AppTitleBarProps = SimpleThemeProps & {focused?:boolean} & HTMLAttributes<any>

const AppTitleBar = styled(FlexRow)(styleCreator((props: AppTitleBarProps) => ({
  ...props.theme.titlebar(props),
    height: 38,
    flexShrink: 0,
    width: '100%',
    alignItems: 'center',
    paddingLeft: 80,
    paddingRight: 10,
    justifyContent: 'space-between',
    WebkitAppRegion: 'drag',
    zIndex: 4
  })));

type StateProps = {
  windowIsFocused: boolean;
  leftSidebarVisible: boolean;
  rightSidebarVisible: boolean;
  rightSidebarAvailable: boolean;
  downloadingImportData: boolean;
}

type Actions = {
  toggleLeftSidebarVisible: (visible?: boolean) => void;
  toggleRightSidebarVisible: (visible?: boolean) => void;
  setActiveSheet: (sheet: ActiveSheet) => void;
}

type OwnProps = {
  version: string;
  launcherMsg?: LauncherMsg;
};

type Props = StateProps & Actions & OwnProps

const VersionText = styled(Text)(({
  theme
}) => ({
  color: theme.colors.textStatus,
  marginLeft: 4,
  marginTop: 2
}));

const Importing = styled(FlexRow)(({
  theme
}) => ({
  color: theme.colors.textStatus,
  alignItems: 'center',
  marginLeft: 10
}));

export class TitleBarNaked extends React.Component<Props> {
  
  render() {
    const
      {
        version,
        windowIsFocused,
        downloadingImportData,
        setActiveSheet,
        leftSidebarVisible,
        launcherMsg,
        rightSidebarVisible,
        toggleLeftSidebarVisible,
        toggleRightSidebarVisible
      } = this.props
    return <AppTitleBar focused={windowIsFocused} className="toolbar">
        <DevicesButton />
        <ScreenCaptureButtons />
        {downloadingImportData && <Importing>
            <LoadingIndicator size={16} />
            &nbsp;Importing data...
          </Importing>}
        <Spacer />
        <VersionText>
          {version}
          {isProduction() ? '' : '-dev'}
        </VersionText>

        {isAutoUpdaterEnabled() ? <AutoUpdateVersion version={version} /> : <UpdateIndicator launcherMsg={launcherMsg} />}
        {config.bugReportButtonVisible && <Button compact={true} onClick={() => setActiveSheet(ACTIVE_SHEET_BUG_REPORTER)} title="Report Bug" icon="bug" />}
        <ButtonGroup>
          <Button compact={true} disabled={false} selected={leftSidebarVisible} onClick={() => toggleLeftSidebarVisible()} icon="icons/sidebar_left.svg" iconSize={20} title="Toggle Plugins" />
          <Button compact={true} disabled={false} selected={rightSidebarVisible} onClick={() => toggleRightSidebarVisible()} icon="icons/sidebar_right.svg" iconSize={20} title="Toggle Details" //disabled={!rightSidebarAvailable}
        />
        </ButtonGroup>
      </AppTitleBar>;
  }

}

export default connect<StateProps,Actions, OwnProps, RootState>(({
  application: {
    windowIsFocused,
    leftSidebarVisible,
    rightSidebarVisible,
    rightSidebarAvailable,
    downloadingImportData,
    launcherMsg
  }
}) => ({
  windowIsFocused,
  leftSidebarVisible,
  rightSidebarVisible,
  rightSidebarAvailable,
  downloadingImportData,
  launcherMsg
}), {
  setActiveSheet,
  toggleLeftSidebarVisible,
  toggleRightSidebarVisible
})(TitleBarNaked);
