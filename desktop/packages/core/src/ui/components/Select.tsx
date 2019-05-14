/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from "react"
import { Component } from "react"
import Text from "./Text"
import styled, { styleCreator } from "../styled"
const Label = styled("label")({
  display: "flex",
  alignItems: "center"
})
const LabelText = styled(Text)({
  fontWeight: 500,
  marginRight: 5
})
const SelectMenu = styled("select")(
  styleCreator(
    ({ grow }) => ({
      flexGrow: grow ? 1 : null
    }),
    ["grow"]
  )
)
/**
 * Dropdown to select from a list of options
 */

export default class Select extends Component<{
  className?: string,
  options: {
    [key: string]: string
  },
  onChange: (key: string) => void,
  selected?: string | null | undefined,
  label?: string,
  grow?: boolean
}> {
  selectID: string = Math.random().toString(36)
  onChange = (event: React.ChangeEvent<any>) => {
    this.props.onChange(event.target.value)
  }

  render() {
    const { className, options, selected, label, grow } = this.props
    let select = (
      <SelectMenu grow={grow} id={this.selectID} onChange={this.onChange} value={selected} className={className}>
        {Object.keys(options).map(key => (
          <option key={key} value={key}>
            {options[key]}
          </option>
        ))}
      </SelectMenu>
    )

    if (label) {
      select = (
        <Label for={this.selectID}>
          <LabelText>{label}</LabelText>
          {select}
        </Label>
      )
    }

    return select
  }
}
