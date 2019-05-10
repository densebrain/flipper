/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from 'react'
import Panel from "./ui/components/Panel"
import ManagedDataInspector from "./ui/components/data-inspector/DataInspector"
import { createTablePlugin } from "./createTablePlugin"
import { colors } from "./ui/themes/colors"
import Text from "./ui/components/Text" //{styled, Text, Toolbar, Spacer, Button}

import styled from "./ui/styled/styled"
import { default as Toolbar, Spacer } from "./ui/components/Toolbar"
import Button from "./ui/components/Button"
import {NativePluginProps} from "./NativePluginTypes"
import {getValue} from "typeguard"
import {Plugin} from "./PluginTypes"

type RowColumnData<T = any> = {
  value: any
  isFilterable: boolean
} & T

type RowData<T = any> = {
  id: string,
  columns: {
    [key: string]: RowColumnData<T>
  },
  sidebar: Array<SidebarSection>
}
type SidebarSection = JsonSection | ToolbarSection
type JsonSection = {
  type: "json",
  title: string,
  content: string
}
type ToolbarSection = {
  type: "toolbar",
  items: [
    {
      type: "link",
      destination: string,
      label: string
    }
  ]
}
const NonWrappingText = styled(Text)({
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  userSelect: "none"
})
const BooleanValue = styled(NonWrappingText)((props: any) => ({
  "&::before": {
    content: '""',
    display: "inline-block",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: props.active ? colors.green : colors.red,
    marginRight: 5,
    marginTop: 1
  }
}))

function renderValue({ type, value }: { type: string, value: any }) {
  switch (type) {
    case "boolean":
      return (
        <BooleanValue code={true} active={value}>
          {value.toString()}
        </BooleanValue>
      )

    default:
      return value
  }
}

function buildRow(rowData: RowData, previousRowData: RowData | null | undefined) {
  if (!rowData.columns) {
    throw new Error("defaultBuildRow used with incorrect data format.")
  }

  const oldColumns =
    previousRowData && previousRowData.columns
      ? Object.keys(previousRowData.columns).reduce((map, key) => {
          if (key !== "id") {
            map[key] = {
              value: (getValue(() => previousRowData.columns) || {})[key].value,
              isFilterable: true
            }
          }

          return map
        }, {} as RowColumnData)
      : {}
  const columns = Object.keys(rowData.columns).reduce((map, key) => {
    if (rowData.columns && key !== "id") {
      const renderedValue = renderValue(rowData.columns[key])
      map[key] = {
        value: renderedValue,
        isFilterable: true
      }
    }

    return map
  }, oldColumns)
  return {
    columns,
    key: rowData.id,
    copyText: JSON.stringify(rowData),
    filterValue: rowData.id
  }
}

function renderToolbar(section: ToolbarSection) {
  const toolbarComponents = section.items.map((item, index) => {
    switch (item.type) {
      case "link":
        return (
          <Button href={item.destination} key={index + 1}>
            {item.label}
          </Button>
        )
    }
  })
  return (
    <Toolbar key="toolbar">
      <Spacer key={0} />
      {toolbarComponents}
    </Toolbar>
  )
}

function renderSidebar(rowData: RowData) {
  if (!rowData.sidebar) {
    throw new Error("renderSidebar used with missing rowData.sidebar")
  }

  if (!Array.isArray(rowData.sidebar)) {
    throw new Error("typeof rowData.sidebar is not array as expected: ")
  }

  return rowData.sidebar.map(renderSidebarSection)
}

function renderSidebarSection(section: SidebarSection, index: number) {
  switch (section.type) {
    case "json":
      return (
        <Panel floating={false} heading={section.title} key={index}>
          <ManagedDataInspector data={section.content} expandRoot={true} />
        </Panel>
      )

    case "toolbar":
      return renderToolbar(section)

    default:
      return (
        <Panel floating={false} heading={"Details"} key={index}>
          <ManagedDataInspector data={section} expandRoot={true} />
        </Panel>
      )
  }
}

export default function createTableNativePlugin(props: NativePluginProps): Plugin {
  const {title, name, id} = props
  return {
    ...Object.assign(
      {},
      props,
      {
        name: name || id,
        entry: null,
        icon: null,
        gatekeeper: null,
        bugs: null
      }
    ),
    component: createTablePlugin({
      method: "updateRows",
      title,
      id,
      renderSidebar: renderSidebar,
      buildRow: buildRow
    })
  }
  
}
