/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from "react"
import {StatoPluginComponent,StatoPluginProps, PluginModuleExport, PluginReducers, PluginType} from "@stato/core"
import { FlexColumn } from "@stato/core"
import { ButtonGroup, Button, styled, colors } from "@stato/core"
export type Sandbox = {
  name: string,
  value: string
}
type SandboxState = {
  sandboxes: Array<Sandbox>,
  customSandbox: string,
  showFeedback: boolean
}
const BigButton = styled(Button)({
  flexGrow: 1,
  fontSize: 24,
  padding: 20
})
const ButtonContainer = styled(FlexColumn)({
  alignItems: "center",
  padding: 20
})
type Props =StatoPluginProps<{}>
type Actions = {
  UpdateSandboxes: {
    type: "UpdateSandboxes"
    sandboxes: Array<Sandbox>
  }
}
class SandboxView extends StatoPluginComponent<Props,SandboxState, Actions> {
  
  static id = "@stato/plugin-sandbox"
  
  static TextInput = styled("input")({
    border: `1px solid ${colors.light10}`,
    fontSize: "1em",
    padding: "0 5px",
    borderRight: 0,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    flexGrow: 1
  })
  static FeedbackMessage = styled("span")({
    fontSize: "1.2em",
    paddingTop: "10px",
    color: "green"
  })
  static TextInputLayout = styled(FlexColumn)({
    float: "left",
    justifyContent: "center",
    flexGrow: 1,
    borderRadius: 4,
    marginRight: 15,
    marginTop: 15,
    marginLeft: 15
  })
  
  constructor(props:Props) {
    super(props)
    this.state = {
      sandboxes: [],
      customSandbox: "",
      showFeedback: false
    }
  }
  
  reducers:PluginReducers<SandboxState, Actions> = {
    UpdateSandboxes(_state, results) {
      return {
        sandboxes: results.results
      }
    }
  }

  init() {
    super.init()
    this.client.call("getSandbox", {}).then((results: Array<Sandbox>) => {
      this.dispatchAction("UpdateSandboxes",{
        results,
        type: "UpdateSandboxes"
      })
    })
  }

  onSendSandboxEnvironment = (sandbox: string) => {
    this.client
      .call<{result: boolean}>("setSandbox", {
        sandbox: sandbox
      })
      .then((result) => {
        setTimeout(() => {
          this.setState({
            showFeedback: false
          })
        }, 3000)
        this.setState(state => ({
          ...state,
          showFeedback: result.result
        }))
      })
  }
  onChangeSandbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      customSandbox: e.target.value
    })
  }

  render() {
    return (
      <FlexColumn>
        <SandboxView.TextInputLayout>
          <ButtonGroup>
            <SandboxView.TextInput
              type="text"
              placeholder="Sandbox URL (e.g. unixname.sb.facebook.com)"
              key="sandbox-url"
              onChange={this.onChangeSandbox}
              onKeyPress={(event: React.KeyboardEvent) => {
                if (event.key === "Enter") {
                  this.onSendSandboxEnvironment(this.state.customSandbox)
                }
              }}
            />
            <Button
              key="sandbox-send"
              icon="download"
              onClick={() => this.onSendSandboxEnvironment(this.state.customSandbox)}
              disabled={this.state.customSandbox == null}
            />
          </ButtonGroup>
          <SandboxView.FeedbackMessage hidden={this.state.showFeedback == false}>Success!</SandboxView.FeedbackMessage>
        </SandboxView.TextInputLayout>
        {this.state.sandboxes.map(sandbox => (
          <ButtonContainer>
            <BigButton key={sandbox.value} onClick={() => this.onSendSandboxEnvironment(sandbox.value)}>
              {sandbox.name}
            </BigButton>
          </ButtonContainer>
        ))}
      </FlexColumn>
    )
  }
}


export default {
  id: SandboxView.id,
  type: PluginType.Normal,
  componentClazz: SandboxView
} as PluginModuleExport<typeof SandboxView>
