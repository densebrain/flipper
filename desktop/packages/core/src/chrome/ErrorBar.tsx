/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from 'react'
import {SimpleThemeProps} from "../ui/themes"
import styled from "../ui/styled"

const ErrorBarContainer = styled("div")(({theme:{colors}}:SimpleThemeProps) => ({
  backgroundColor: colors.error,
  bottom: 0,
  color: colors.errorText,
  left: 0,
  lineHeight: "26px",
  position: "absolute",
  right: 0,
  textAlign: "center",
  zIndex: 2
}))
export default function ErrorBar(props: { text: string | null }) {
  if (props.text == null) {
    return null
  } else {
    return <ErrorBarContainer>{props.text}</ErrorBarContainer>
  }
}
