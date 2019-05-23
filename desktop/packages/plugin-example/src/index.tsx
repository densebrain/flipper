/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */

import * as React from 'react'
import {
  PluginModuleExport,
  FlipperPluginProps,
  Notification,
  Button,
  Input,
  FlipperPluginComponent,
  FlexColumn,
  styled,
  Text,
  PluginType,
  PluginClientMessage
} from "@flipper/core"


type Actions = {
  triggerNotification: TriggerNotificationAction
  displayMessage: DisplayMessageAction
  
}

//type ActionType = keyof Actions

type TriggerNotificationAction = {
  id: number
}

type DisplayMessageAction = {
  message: string
}

// type ActionPayload<Type extends ActionType> =
//   Type extends "triggerNotification" ? TriggerNotificationAction : Type extends "displayMessage" ?  DisplayMessageAction : never


//PluginActions<ActionType, ActionPayload<ActionType>>

type DisplayMessageResponse = {
  greeting: string
}

type ExampleClientMessage =
  PluginClientMessage<"triggerNotification", TriggerNotificationAction> |
  PluginClientMessage<"displayMessage", DisplayMessageAction>

type State = {
  prompt?: string | null | undefined
  message?: string | null | undefined
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

type Props = FlipperPluginProps<PersistedState>

class ExamplePlugin extends FlipperPluginComponent<Props, State, Actions, PersistedState> {
  static id = "@flipper/plugin-example"
  static title = "Example"
  
  static defaultPersistedState = {
    currentNotificationIds: [],
    receivedMessage: null
  } as PersistedState
  
  
  /**
   * Reducer to process incoming "send" messages from the mobile counterpart.
   */
  static persistedStateReducer = (
    persistedState: PersistedState,
    msg: ExampleClientMessage
  ): PersistedState => {
    const {type} = msg
    if (msg.type === "displayMessage") {
      
      const {payload:{message}} = msg
      return { ...persistedState, receivedMessage: message }
    } else if (type === "triggerNotification") {
      const {payload:{id}} = msg
      return { ...persistedState, currentNotificationIds: persistedState.currentNotificationIds.concat([id]) }
    }
    
    
    return persistedState
  }
  
  /**
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
  
  constructor(props: Props) {
    super(props)
    
    this.state = {}
    
  }
  
  /*
   * Call a method of the mobile counterpart, to display a message.
   */

  sendMessage() {
    this.client
      .call("displayMessage", {
        message: this.state.message || "Weeeee4!"
      })
      .then((_params: DisplayMessageResponse) => {
        this.setState({
          prompt: "Nice"
        })
      })
  }

  render() {
    const {persistedState} = this.props
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
        {persistedState.receivedMessage && <Text> {persistedState.receivedMessage} </Text>}
      </Container>
    )
  }
}

export default {
  id: ExamplePlugin.id,
  type: PluginType.Normal,
  title: ExamplePlugin.title,
  componentClazz: ExamplePlugin
} as PluginModuleExport<typeof ExamplePlugin>
