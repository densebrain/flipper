/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from "react"
import styled from "../ui/styled"
import Text from "../ui/components/Text"
import {SimpleThemeProps} from "../ui/themes"
import FlexRow from "../ui/components/FlexRow"
import FlexBox from "../ui/components/FlexBox"
import Button from "../ui/components/Button"
import Popover from "../ui/components/Popover"

const Heading = styled(Text)(({theme:{colors}}:SimpleThemeProps) => ({
  display: "block",
  backgroundColor: colors.background,
  color: colors.text,
  fontSize: 11,
  fontWeight: 600,
  lineHeight: "21px",
  padding: "4px 8px 0"
}))
const PopoverItem = styled(FlexRow)(({theme:{colors}}:SimpleThemeProps) => ({
  alignItems: "center",
  borderBottom: `1px solid ${colors.border}`,
  height: 50,
  "&:last-child": {
    borderBottom: "none"
  }
}))
const ItemTitle = styled(Text)({
  display: "block",
  fontSize: 14,
  fontWeight: 400,
  lineHeight: "120%",
  textOverflow: "ellipsis",
  overflow: "hidden",
  whiteSpace: "nowrap",
  marginBottom: 1
})
const ItemSubtitle = styled(Text)(({theme:{colors}}:SimpleThemeProps) => ({
  display: "block",
  fontWeight: 400,
  fontSize: 11,
  color: colors.text,
  lineHeight: "14px",
  textOverflow: "ellipsis",
  overflow: "hidden",
  whiteSpace: "nowrap"
}))
const ItemImage = styled(FlexBox)(() => ({
  alignItems: "center",
  justifyContent: "center",
  width: 40,
  flexShrink: 0
}))
const ItemContent = styled("div")({
  minWidth: 0,
  paddingRight: 5,
  flexGrow: 1
})
const Section = styled("div")(({theme:{colors}}:SimpleThemeProps) => ({
  maxWidth: 260,
  borderBottom: `1px solid ${colors.border}`,
  "&:last-child": {
    borderBottom: "none"
  }
}))
const Action = styled(Button)(({theme:{colors}}:SimpleThemeProps) => ({
  border: `1px solid ${colors.border}`,
  background: "transparent",
  color: colors.text,
  marginRight: 8,
  marginLeft: 4,
  lineHeight: "22px",
  "&:hover": {
    background: "transparent"
  },
  "&:active": {
    background: "transparent",
    border: `1px solid ${colors.borderSelected}`
  }
}))
type Props = {
  sections: Array<{
    title: string,
    items: Array<{
      title: string,
      subtitle: string,
      onClick?: Function,
      icon?: React.ReactElement<any>
    }>
  }>,
  onDismiss: Function
}
export default class DevicesList extends React.PureComponent<Props> {
  render() {
    return (
      <Popover onDismiss={this.props.onDismiss}>
        {this.props.sections.map(section => {
          if (section.items.length > 0) {
            return (
              <Section key={section.title}>
                <Heading>{section.title}</Heading>
                {section.items.map(item => (
                  <PopoverItem key={item.title}>
                    <ItemImage>{item.icon}</ItemImage>
                    <ItemContent>
                      <ItemTitle>{item.title}</ItemTitle>
                      <ItemSubtitle>{item.subtitle}</ItemSubtitle>
                    </ItemContent>
                    {item.onClick && (
                      <Action onClick={item.onClick} compact={true}>
                        Run
                      </Action>
                    )}
                  </PopoverItem>
                ))}
              </Section>
            )
          } else {
            return null
          }
        })}
      </Popover>
    )
  }
}
