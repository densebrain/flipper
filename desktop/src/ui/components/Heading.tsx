/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import styled from "../styled/index"
const LargeHeading = styled("div")({
  fontSize: 18,
  fontWeight: "bold",
  lineHeight: "20px",
  borderBottom: "1px solid #ddd",
  marginBottom: 10
})
const SmallHeading = styled("div")({
  fontSize: 12,
  color: "#90949c",
  fontWeight: "bold",
  marginBottom: 10,
  textTransform: "uppercase"
})
/**
 * A heading component.
 */

export default function Heading(props: { level?: number, children?: React.ReactNode }) {
  if (props.level === 1) {
    return <LargeHeading>{props.children}</LargeHeading>
  } else {
    return <SmallHeading>{props.children}</SmallHeading>
  }
}
