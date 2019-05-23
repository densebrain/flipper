/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Sidebar from '../ui/components/Sidebar';
import { connect } from 'react-redux';
import { toggleRightSidebarAvailable } from '../reducers/ApplicationReducer';
import {RootState} from "../reducers"
type OwnProps = {
  children: any;
  width?: number;
  minWidth?: number;
};

type StateProps = {
  rightSidebarVisible: boolean;
  rightSidebarAvailable: boolean;
}

type Actions = {
  toggleRightSidebarAvailable: (visible: boolean) => any;
}

type Props = StateProps & Actions & OwnProps;

class DetailSidebar extends React.Component<Props> {
  componentDidMount() {
    this.updateSidebarAvailability();
  }

  componentDidUpdate() {
    this.updateSidebarAvailability();
  }

  updateSidebarAvailability() {
    const available = Boolean(this.props.children);

    if (available !== this.props.rightSidebarAvailable) {
      this.props.toggleRightSidebarAvailable(available);
    }
  }

  render() {
    const domNode = document.getElementById('detailsSidebar');
    return this.props.children && this.props.rightSidebarVisible && domNode && ReactDOM.createPortal(<Sidebar minWidth={this.props.minWidth} width={this.props.width || 300} position="right">
          {this.props.children}
        </Sidebar>, domNode);
  }

}

export default connect<StateProps, Actions, OwnProps, RootState>(({
  application: {
    rightSidebarVisible,
    rightSidebarAvailable
  }
}) => ({
  rightSidebarVisible,
  rightSidebarAvailable
}), {
  toggleRightSidebarAvailable
})(DetailSidebar);
