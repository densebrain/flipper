/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 * @flow
 */
import * as React from 'react'
import {
  PluginExport,
  FlipperPluginProps,
  Notification,
  Button,
  Input,
  FlipperPluginComponent,
  FlexColumn,
  styled,
  Text,
  PluginType
} from "@flipper/core"


type ActionType = "triggerNotification" | "displayMessage"

type ActionPayload<Type extends ActionType> =
  Type extends "triggerNotification" ? {
    type: Type
  id: number
} : Type extends "displayMessage" ?  {
    type: Type
  msg: string
} : never

type Actions = {[type in ActionType]: ActionPayload<type>}//PluginActions<ActionType, ActionPayload<ActionType>>

type DisplayMessageResponse = {
  greeting: string
}
type State = {
  prompt: string,
  message: string
}
type PersistedState = {
  currentNotificationIds: Array<number>,
  receivedMessage: string | null | undefined
}
const Container = styled(FlexColumn)({
  alignItems: "center",
  justifyContent: "space-around",
  padding: 20
})
class ExamplePlugin extends FlipperPluginComponent<FlipperPluginProps<PersistedState>, State, Actions, PersistedState> {
  static id = "Example"
  static title = "Example"
  
  static defaultPersistedState = {
    currentNotificationIds: [],
    receivedMessage: null
  } as PersistedState
  
  
  /*
   * Reducer to process incoming "send" messages from the mobile counterpart.
   */

  static persistedStateReducer = (
    persistedState: PersistedState,
    method: ActionType,
    payload: ActionPayload<typeof method>
  ): PersistedState => {
    switch (payload.type) {
      case "triggerNotification":
        return { ...persistedState, currentNotificationIds: persistedState.currentNotificationIds.concat([payload.id]) }
      case "displayMessage":
        return { ...persistedState, receivedMessage: payload.msg }
    }
    
    return persistedState
  }
  /*
   * Callback to provide the currently active notifications.
   */

  static getActiveNotifications = (persistedState: PersistedState): Array<Notification> => {
    return persistedState.currentNotificationIds.map((x: number) => {
      return {
        id: "test-notification:" + x,
        message: "Example Notification",
        severity: "warning",
        title: "Notification: " + x
      }
    })
  }
  /*
   * Call a method of the mobile counterpart, to display a message.
   */

  sendMessage() {
    this.client
      .call("displayMessage", {
        message: this.state.message || "Weeeee!"
      })
      .then((_params: DisplayMessageResponse) => {
        this.setState({
          prompt: "Nice"
        })
      })
  }

  render() {
    return (
      <Container>
        <Text>{this.state.prompt}</Text>
        <Input
          placeholder="Message"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            this.setState({
              message: event.target.value
            })
          }}
        />
        <Button onClick={this.sendMessage.bind(this)}>Send</Button>
        {this.props.persistedState.receivedMessage && <Text> {this.props.persistedState.receivedMessage} </Text>}
      </Container>
    )
  }
}

export default {
  id: ExamplePlugin.id,
  type: PluginType.Normal,
  title: ExamplePlugin.title,
  componentClazz: ExamplePlugin
} as PluginExport<typeof ExamplePlugin>
