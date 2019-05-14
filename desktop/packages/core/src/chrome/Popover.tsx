/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from "react"
import styled from "../ui/styled"
import FlexColumn from "../ui/components/FlexColumn"
import Text from "../ui/components/Text"
import FlexRow from "../ui/components/FlexRow"
import {SimpleThemeProps} from "../ui/themes"
import FlexBox from "../ui/components/FlexBox"
import Button from "../ui/components/Button"

const Anchor = styled("img")({
  zIndex: 6,
  position: "absolute",
  bottom: 0,
  left: "50%",
  transform: "translate(-50%, calc(100% + 2px))"
})
const PopoverContainer = styled(FlexColumn)(({theme:{colors}}) => ({
  backgroundColor: colors.white,
  borderRadius: 7,
  border: "1px solid rgba(0,0,0,0.3)",
  boxShadow: "0 2px 10px 0 rgba(0,0,0,0.3)",
  position: "absolute",
  zIndex: 5,
  minWidth: 240,
  bottom: 0,
  marginTop: 15,
  left: "50%",
  transform: "translate(-50%, calc(100% + 15px))",
  overflow: "hidden",
  "&::before": {
    content: '""',
    display: "block",
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    height: 13,
    top: -13,
    width: 26,
    backgroundColor: colors.white
  }
}))
const Heading = styled(Text)(({theme:{colors}}: SimpleThemeProps) => ({
  display: "block",
  backgroundColor: colors.background,
  color: colors.text,
  fontSize: 11,
  fontWeight: 600,
  lineHeight: "21px",
  padding: "4px 8px 0"
}))
const PopoverItem = styled(FlexRow)(({theme:{colors}}: SimpleThemeProps) => ({
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
const ItemSubtitle = styled(Text)(({theme:{colors}}: SimpleThemeProps) => ({
  display: "block",
  fontWeight: 400,
  fontSize: 11,
  color: colors.textLight,
  lineHeight: "14px",
  textOverflow: "ellipsis",
  overflow: "hidden",
  whiteSpace: "nowrap"
}))
const ItemImage = styled(FlexBox)({
  alignItems: "center",
  justifyContent: "center",
  width: 40,
  flexShrink: 0
})
const ItemContent = styled("div")({
  minWidth: 0,
  paddingRight: 5,
  flexGrow: 1
})
const Section = styled("div")(({theme:{colors}}: SimpleThemeProps) => ({
  borderBottom: `1px solid ${colors.border}`,
  "&:last-child": {
    borderBottom: "none"
  }
}))
const Action = styled(Button)(({theme:{colors}}: SimpleThemeProps) => ({
  border: `1px solid ${colors.border}`,
  background: "transparent",
  color: colors.text,
  marginRight: 8,
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
      icon?: React.ReactNode
    }>
  }>,
  onDismiss: Function
}
export default class Popover extends React.PureComponent<Props> {
  _ref: HTMLElement | null | undefined

  componentDidMount() {
    window.document.addEventListener("click", this.handleClick)
  }

  componentWillUnmount() {
    window.document.addEventListener("click", this.handleClick)
  }

  handleClick = (e: MouseEvent) => {
    // $FlowFixMe
    if (e.target instanceof HTMLElement && this._ref && !this._ref.contains(e.target)) {
      this.props.onDismiss()
    }
  }
  _setRef = (ref: HTMLElement | null | undefined) => {
    this._ref = ref
  }

  render() {
    return [
      <Anchor src="./anchor.svg" key="anchor" />,
      <PopoverContainer innerRef={this._setRef} key="popup">
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
      </PopoverContainer>
    ]
  }
}
