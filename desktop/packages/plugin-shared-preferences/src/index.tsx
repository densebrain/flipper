/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from 'react'
import {
  StatesPluginComponent,
  ManagedTable,
  Text,
  Heading,
  FlexColumn,
  colors,
  FlexRow,
  ManagedDataInspector,
  styled,
  Select,
  StatesPluginProps, PluginType, PluginModuleExport
} from "@states/core"
import { clone,mapKeys } from "lodash"

type ActionType = "UpdateSharedPreferences" | "ChangeSharedPreferences" | "UpdateSelectedSharedPreferences"

type UpdateSharedPreferences = {
  name: string | null | undefined
  preferences: SharedPreferences
}
type ActionPayload<Type extends ActionType> = {type: Type} & (
  Type extends "ChangeSharedPreferences" ? {
    change: SharedPreferencesChangeEvent
  } : Type extends "UpdateSelectedSharedPreferences" ? {
    msg: string
    selected?: string | undefined
  } : Type extends "UpdateSharedPreferences" ? {
    update: UpdateSharedPreferences
  } : never
  )
type Actions = {[type in ActionType]: ActionPayload<type>}
//type Actions =  PluginActions<ActionType, ActionPayload<ActionType>>


type SharedPreferencesChangeEvent = {
  preferences: string,
  name: string,
  time: number,
  deleted: boolean,
  value: string
}
export type SharedPreferences = {
  [name: string]: any
}
type SharedPreferencesEntry = {
  preferences: SharedPreferences,
  changesList: Array<SharedPreferencesChangeEvent>
}
type SharedPreferencesMap = {
  [name: string]: SharedPreferencesEntry
}
type SharedPreferencesState = {
  selectedPreferences: string | null | undefined,
  sharedPreferences: SharedPreferencesMap
}
const CHANGELOG_COLUMNS = {
  event: {
    value: "Event"
  },
  name: {
    value: "Name"
  },
  value: {
    value: "Value"
  }
}
const CHANGELOG_COLUMN_SIZES = {
  event: "30%",
  name: "30%",
  value: "30%"
}
const UPDATED_LABEL = <Text color={colors.lime}>Updated</Text>
const DELETED_LABEL = <Text color={colors.cherry}>Deleted</Text>
const InspectorColumn = styled(FlexColumn)({
  flexGrow: 0.2
})
const ChangelogColumn = styled(FlexColumn)({
  flexGrow: 0.8,
  paddingLeft: "16px"
})
const RootColumn = styled(FlexColumn)({
  paddingLeft: "16px",
  paddingRight: "16px",
  paddingTop: "16px"
})

type Props = StatesPluginProps<{}>

class SharedPreferencesPlugin extends StatesPluginComponent<Props, SharedPreferencesState, Actions, {}> {
  
  static id = "@states/plugin-shared-preferences"
  
  static title = SharedPreferencesPlugin.id
  
  constructor(props: Props) {
    super(props)
    this.state = {
      selectedPreferences: null,
      sharedPreferences: {}
    }
  }
  
  
  reducers:{[name in ActionType]: (state: SharedPreferencesState, payload: Actions[name]) => Partial<SharedPreferencesState>} = {
    UpdateSharedPreferences: (state, results) => {
      let update = results.update
      let entry = state.sharedPreferences[update.name] || {
        changesList: []
      } as SharedPreferencesEntry
      entry.preferences = update.preferences
      state.sharedPreferences[update.name] = entry
      return {
        selectedPreferences: state.selectedPreferences || update.name,
        sharedPreferences: state.sharedPreferences
      }
    },

    ChangeSharedPreferences: (state, event) => {
      const change = event.change
      const entry = state.sharedPreferences[change.preferences]

      if (entry == null) {
        return state
      }

      if (change.deleted) {
        delete entry.preferences[change.name]
      } else {
        entry.preferences[change.name] = change.value
      }

      entry.changesList = [change, ...entry.changesList]
      return {
        selectedPreferences: state.selectedPreferences,
        sharedPreferences: state.sharedPreferences
      }
    },

    UpdateSelectedSharedPreferences: (state, event) => {
      return {
        selectedPreferences: event.selected,
        sharedPreferences: state.sharedPreferences
      }
    }
  }

  init() {
    super.init()
    this.client.call("getAllSharedPreferences").then((results: { [name: string]: SharedPreferences }) => {
      Object.entries(results).forEach(([name, prefs]) => {
        const update = {
          name: name,
          preferences: prefs
        }
        this.dispatchAction("UpdateSharedPreferences",{
          update,
          type: "UpdateSharedPreferences"
        })
      })
    })
    this.client.subscribe("sharedPreferencesChange", (change: SharedPreferencesChangeEvent) => {
      this.dispatchAction("ChangeSharedPreferences", {
        change,
        type: "ChangeSharedPreferences"
      })
    })
  }

  onSharedPreferencesChanged = (path: Array<string>, value: any) => {
    const selectedPreferences = this.state.selectedPreferences

    if (selectedPreferences == null) {
      return
    }

    const entry = this.state.sharedPreferences[selectedPreferences]

    if (entry == null) {
      return
    }

    const values = entry.preferences
    let newValue = value

    if (path.length === 2 && values) {
      newValue = clone(values[path[0]])
      newValue[path[1]] = value
    }

    this.client
      .call("setSharedPreference", {
        sharedPreferencesName: this.state.selectedPreferences,
        preferenceName: path[0],
        preferenceValue: newValue
      })
      .then((results: SharedPreferences) => {
        const update: UpdateSharedPreferences = {
          name: this.state.selectedPreferences,
          preferences: results
        }
        this.dispatchAction("UpdateSharedPreferences",{
          update,
          type: "UpdateSharedPreferences"
        })
      })
  }
  onSharedPreferencesSelected = (selected: string) => {
    this.dispatchAction("UpdateSelectedSharedPreferences", {
      selected: selected,
      type: "UpdateSelectedSharedPreferences"
    })
  }

  render() {
    const {selectedPreferences, sharedPreferences} = this.state

    if (selectedPreferences == null) {
      return null
    }

    const entry = sharedPreferences[selectedPreferences]

    if (entry == null) {
      return null
    }

    return (
      <RootColumn grow={true}>
        <Heading>
          <span
            style={{
              marginRight: "16px"
            }}
          >
            Preference File
          </span>
          <Select
            options={mapKeys(Object.keys(sharedPreferences), key => key)}
            onChange={this.onSharedPreferencesSelected}
          />
        </Heading>
        <FlexRow grow={true} scrollable={true}>
          <InspectorColumn>
            <Heading>Inspector</Heading>
            <ManagedDataInspector data={entry.preferences} setValue={this.onSharedPreferencesChanged} />
          </InspectorColumn>
          <ChangelogColumn>
            <Heading>Changelog</Heading>
            <ManagedTable
              columnSizes={CHANGELOG_COLUMN_SIZES}
              columns={CHANGELOG_COLUMNS}
              rowLineHeight={26}
              items={entry.changesList.map((element, index) => {
                return {
                  columns: {
                    event: {
                      value: element.deleted ? DELETED_LABEL : UPDATED_LABEL
                    },
                    name: {
                      value: element.name
                    },
                    value: {
                      value: element.value
                    }
                  },
                  key: String(index)
                }
              })}
            />
          </ChangelogColumn>
        </FlexRow>
      </RootColumn>
    )
  }
}

export default {
  id: SharedPreferencesPlugin.id,
  type: PluginType.Normal,
  title: SharedPreferencesPlugin.title,
  componentClazz: SharedPreferencesPlugin
} as PluginModuleExport
