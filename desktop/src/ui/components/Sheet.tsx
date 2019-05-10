/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import { Component } from "react"
import { createPortal } from "react-dom"
import { connect } from "react-redux"
import { setActiveSheet } from "../../reducers/application"
import { ActiveSheet } from "../../reducers/application"
export const PLUGIN_SHEET_ELEMENT_ID = "pluginSheetContents"
type Props = {
  children: (onHide: () => void) => React.Node | null | undefined,
  setActiveSheet: (sheet: ActiveSheet) => any,
  activeSheet: ActiveSheet
}
type State = {
  content: React.Node | null | undefined
}
/**
 * Usage: <Sheet>{onHide => <YourSheetContent onHide={onHide} />}</Sheet>
 */

class Sheet extends Component<Props, State> {
  static getDerivedStateFromProps(props: Props) {
    if (props.activeSheet === "PLUGIN_SHEET") {
      return {
        content: props.children(() => {
          props.setActiveSheet(null)
        })
      }
    }

    return null
  }

  state = {
    content: this.props.children(() => {
      this.props.setActiveSheet(null)
    })
  }

  componentDidMount() {
    this.showSheetIfContentsAvailable()
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (prevState.content !== this.state.content) {
      this.showSheetIfContentsAvailable()
    }
  }

  showSheetIfContentsAvailable = () => {
    if (this.state.content) {
      this.props.setActiveSheet("PLUGIN_SHEET")
    } else {
      this.props.setActiveSheet(null)
    }
  }

  render() {
    const container = document.getElementById(PLUGIN_SHEET_ELEMENT_ID)

    if (this.state.content && container) {
      return createPortal(this.state.content, container)
    }

    if (this.state.content) {
      console.warn(`The <Sheet> could not be displayed, because there was not element#${PLUGIN_SHEET_ELEMENT_ID}.`)
    }

    return null
  }
} // $FlowFixMe

export default connect(
  ({ application: { activeSheet } }) => ({
    activeSheet
  }),
  {
    setActiveSheet
  }
)(Sheet)
