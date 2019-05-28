/**
 * Copyright 2019-present Densebrain.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Copyright 2019-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from "react"
import { HTMLAttributes, PureComponent } from "react"

import isProduction from "../utils/isProduction"
import { remote, shell } from "electron"
import styled, {
  classNames,
  Fill,
  makeDimensionConstraints,
  makeTransition,
  PositionRelative,
  rem,
  styleCreator,
  Transparent
} from "../ui/styled"
import { lighten } from "@material-ui/core/styles/colorManipulator"
import FlexColumn from "../ui/components/FlexColumn"
import FlexRow from "../ui/components/FlexRow"
import Text from "../ui/components/Text"
//import Glyph, { GlyphProps } from "../ui/components/Glyph"
import { Theme, ThemeProps, withStyles, withTheme } from "../ui/themes"
import { Logo } from "../ui/components/Logo"
import { FlexColumnCenter } from "../ui/styled/flex-styles"
import {
  Icon as FontIcon,
  IconProps,
  makeFASolidIcon
} from "../ui/components/Icon"
import Posed from "react-pose"

const Container = styled(FlexColumn)(({ theme: { colors } }) => ({
  height: "100%",
  width: "100%",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: colors.background
}))

const Welcome = styled(FlexColumn)(
  styleCreator(
    ({ theme, isMounted }) => ({
      ...FlexColumnCenter,
      width: "50%",
      background: lighten(theme.colors.backgroundStatus, 0.3),
      borderRadius: 10,
      boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
      overflow: "hidden",
      opacity: isMounted ? 1 : 0,
      transform: `translateY(${isMounted ? 0 : 20}px)`,
      transition: "0.6s all ease-out"
    }),
    ["isMounted", "mounted"]
  )
)

const Title = styled(Text)(({ theme: { colors } }) => ({
  fontSize: rem(1.8),
  fontWeight: 300,
  textAlign: "center",
  color: colors.text,
  marginBottom: 16
}))

const Version = styled(Text)(({ theme: { colors } }) => ({
  textAlign: "center",
  fontSize: rem(1),
  fontWeight: 300,
  color: colors.textStatus,
  marginBottom: rem(4)
}))

const Item = withStyles(({ colors }: Theme) => ({
  root: {
    ...makeTransition(["background-color"]),
    backgroundColor: Transparent,
    padding: rem(1),
    cursor: "pointer",
    alignItems: "center",
    borderTop: `0.1rem solid ${lighten(colors.border, 0.25)}`,
    "&:first-child": {
      borderTop: `0.1rem solid ${Transparent}`
    },
    "&:hover, &:focus, &:active": {
      backgroundColor: lighten(colors.backgroundStatus, 0.15),
      textDecoration: "none",
      "& .icon": {
        color: ({ iconColor }: { iconColor: string }) =>
          !iconColor ? colors.text : lighten(iconColor, 0.3),
        // backgroundColor: ({ iconColor }: { iconColor: string }) =>
        //   !iconColor ? null : lighten(iconColor, 0.3)
      }
    }
  }
}))(({ classes, className, ...other }) => (
  <FlexRow className={classNames(classes.root, className)} {...other} />
))

const ItemTitle = styled(Text)(({ theme: { colors } }) => ({
  color: colors.text,
  fontSize: rem(1.3)
}))

const ItemSubTitle = styled(Text)(({ theme: { colors } }) => ({
  color: colors.textStatus,
  fontSize: rem(1.0),
  marginTop: 2
}))

const Icon = styled((props: IconProps) => <FontIcon {...props} />)(
  ({ theme: { colors } }) => ({
    color: colors.accent,
    fontSize: rem(1.8),
    ...makeTransition(["background-color"]),
    marginRight: rem(1.5),
    marginLeft: rem(1)
  })
)

const BigLogoWrapper = Posed.div({
  hidden: {
    opacity: 0,
    rotate: 0,
    scale: 0
  },
  visible: {
    opacity: 1,

    rotate: "180deg",
    scale: 1,

    transition: { duration: 750 }
  }
})

const BigLogo = withStyles((_theme: Theme) => ({
  root: {
    ...FlexColumnCenter,
    ...PositionRelative,
    marginTop: 50,
    marginBottom: 20,
    ...makeDimensionConstraints("20%")
  },
  logo: {
    ...Fill
  }
}))(
  ({
    classes,
    className,
    ...other
  }: ThemeProps<HTMLAttributes<any>, "root" | "logo">) => (
    <BigLogoWrapper className={classNames(classes.root, className)} {...other}>
      <Logo className={classes.logo} />
    </BigLogoWrapper>
  )
)

type Props = ThemeProps<{}, string, true>
type State = {
  isMounted: boolean
}
export default withTheme()(
  class WelcomeScreen extends PureComponent<Props, State> {
    constructor(props: Props) {
      super(props)

      this.state = {
        isMounted: false
      }
    }

    private timer: number | null | undefined

    componentDidMount() {
      // waiting sometime before showing the welcome screen to allow Stato to
      // connect to devices, if there are any
      this.timer = (setTimeout as any)(() => {
        this.setState({
          isMounted: true
        })
        this.timer = null
      }, 1500)
    }

    componentWillUnmount() {
      if (this.timer) {
        clearTimeout(this.timer)
        this.timer = null
      }
    }

    render() {
      const { theme } = this.props,
        { isMounted } = this.state,
        { colors } = theme
      return (
        <Container>
          <Welcome isMounted={this.state.isMounted}>
            {/* src={require("!!file-loader!assets/icon.png")} */}
            <BigLogo
              style={{ opacity: 0 }}
              pose={isMounted ? "visible" : "hidden"}
            />

            <Title>Welcome to Stato</Title>
            <Version>
              {isProduction()
                ? `Version ${remote.app.getVersion()}`
                : "Development Mode"}
            </Version>
            <FlexColumn>
              <Item
                iconColor={colors.accent}
                onClick={() =>
                  shell.openExternal(
                    "https://fbstates.com/docs/understand.html"
                  )
                }
              >
                <Icon meta={makeFASolidIcon("rocket")} className="icon" />
                <FlexColumn>
                  <ItemTitle>Using Stato</ItemTitle>
                  <ItemSubTitle>
                    Learn how Stato can help you debug your App
                  </ItemSubTitle>
                </FlexColumn>
              </Item>
              <Item
                iconColor={colors.accent}
                onClick={() =>
                  shell.openExternal(
                    "https://fbstates.com/docs/create-plugin.html"
                  )
                }
              >
                <Icon meta={makeFASolidIcon("magic")} className="icon" />
                <FlexColumn>
                  <ItemTitle>Create your own plugin</ItemTitle>
                  <ItemSubTitle>Get started with these pointers</ItemSubTitle>
                </FlexColumn>
              </Item>
              <Item
                iconColor={colors.accent}
                onClick={() =>
                  shell.openExternal(
                    "https://fbstates.com/docs/getting-started.html"
                  )
                }
              >
                <Icon meta={makeFASolidIcon("tools")} className="icon" />
                <FlexColumn>
                  <ItemTitle>Add Stato support to your app</ItemTitle>
                  <ItemSubTitle>Get started with these pointers</ItemSubTitle>
                </FlexColumn>
              </Item>
              <Item
                iconColor={colors.accent}
                onClick={() =>
                  shell.openExternal(
                    "https://github.com/facebook/states/issues"
                  )
                }
              >
                <Icon
                  meta={makeFASolidIcon("comments-alt")}
                  className="icon"
                  style={{ color: colors.accent }}
                />
                <FlexColumn>
                  <ItemTitle>Contributing and Feedback</ItemTitle>
                  <ItemSubTitle>
                    Report issues and help us improve Stato
                  </ItemSubTitle>
                </FlexColumn>
              </Item>
            </FlexColumn>
          </Welcome>
        </Container>
      )
    }
  }
)
