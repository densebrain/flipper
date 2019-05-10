/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import { DataValueExtractor, DataInspectorExpanded } from "./DataInspector"
import { PureComponent } from "react"
import DataInspector from "./DataInspector"
type ManagedDataInspectorProps = {
  data: any,
  diff?: any,
  expandRoot?: boolean,
  extractValue?: DataValueExtractor,
  setValue?: (path: Array<string>, val: any) => void,
  collapsed?: boolean,
  tooltips?: Object
}
type ManagedDataInspectorState = {
  expanded: DataInspectorExpanded
}
/**
 * Wrapper around `DataInspector` that handles expanded state.
 *
 * If you require lower level access to the state then use `DataInspector`
 * directly.
 */

export default class ManagedDataInspector extends PureComponent<ManagedDataInspectorProps, ManagedDataInspectorState> {
  constructor(props: ManagedDataInspectorProps, context: Object) {
    super(props, context)
    this.state = {
      expanded: {}
    }
  }

  onExpanded = (expanded: DataInspectorExpanded) => {
    this.setState({
      expanded
    })
  }

  render() {
    return (
      <DataInspector
        data={this.props.data}
        diff={this.props.diff}
        extractValue={this.props.extractValue}
        setValue={this.props.setValue}
        expanded={this.state.expanded}
        onExpanded={this.onExpanded}
        expandRoot={this.props.expandRoot}
        collapsed={this.props.collapsed}
        tooltips={this.props.tooltips}
      />
    )
  }
}
