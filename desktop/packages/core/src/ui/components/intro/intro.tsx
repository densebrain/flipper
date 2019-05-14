/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from "react"
import styled from "../../styled"
import FlexColumn from "../FlexColumn"
import FlexRow from "../FlexRow"
import FlexBox from "../FlexBox"
import {SimpleThemeProps, withTheme} from "../../themes"
import Text from "../Text"
import View from "../View"
import Glyph from "../Glyph"

const Containter = styled(FlexColumn)({
  fontSize: 17,
  justifyContent: "center",
  marginLeft: 60,
  marginRight: 60,
  width: "auto",
  fontWeight: 300,
  lineHeight: "140%",
  maxWidth: 700,
  minWidth: 450
})
const TitleRow = styled(FlexRow)({
  alignItems: "center",
  marginBottom: 40
})
const Icon = styled(FlexBox)(({theme:{colors}}:SimpleThemeProps) => ({
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: colors.accent,
  width: 32,
  height: 32,
  flexShrink: 0,
  borderRadius: 6
}))
const Title = styled(Text)({
  fontSize: 30,
  fontWeight: 300,
  paddingLeft: 10
})
const Button = styled(View)(({theme:{colors}}:SimpleThemeProps) => ({
  marginTop: 40,
  marginBottom: 30,
  borderRadius: 6,
  color: colors.accentText,
  border: "none",
  background: colors.accent,
  padding: "10px 30px",
  fontWeight: 500,
  fontSize: "1em",
  alignSelf: "flex-start"
}))
const Screenshot = styled("img")(({theme:{colors}}:SimpleThemeProps) => ({
  alignSelf: "center",
  boxShadow: "0 5px 35px rgba(0,0,0,0.3)",
  borderRadius: 5,
  border: `1px solid ${colors.border}`,
  transform: "translateX(5px)",
  overflow: "hidden",
  maxHeight: "80%",
  flexShrink: 0
}))
type Props = SimpleThemeProps & {
  title: string,
  icon?: string,
  screenshot?: string | null | undefined,
  children: React.ReactChildren,
  onDismiss: () => void
}
export default withTheme()(class Intro extends React.PureComponent<Props> {
  render() {
    const { theme:{colors}, icon, children, title, onDismiss, screenshot } = this.props
    return (
      <FlexRow grow={true}>
        <Containter>
          <TitleRow>
            {icon != null && (
              <Icon>
                <Glyph name={icon} size={24} color={colors.text} />
              </Icon>
            )}
            <Title>{title}</Title>
          </TitleRow>
          {children}
          <Button onClick={onDismiss}>Let's go</Button>
        </Containter>
        {screenshot != null && <Screenshot src={screenshot} />}
      </FlexRow>
    )
  }
})
