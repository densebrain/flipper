/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from "react"
import {PureComponent} from "react"

import isProduction from '../utils/isProduction'
import {remote, shell} from 'electron'
import styled, {makeTransition, styleCreator, Transparent} from '../ui/styled'
import {lighten} from '@material-ui/core/styles/colorManipulator'
import FlexColumn from "../ui/components/FlexColumn"
import FlexRow from "../ui/components/FlexRow"
import Text from "../ui/components/Text"
import Glyph from "../ui/components/Glyph"
import {ThemeProps, withTheme} from "../ui/themes"

const Container = styled(FlexColumn)(props => {
  const {
    colors
  } = props.theme
  return {
    height: '100%', width: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background
  }
})
const Welcome = styled(FlexColumn)(styleCreator(({
                                                   theme, isMounted
                                                 }) => ({
  width: 460, background: theme.colors.backgroundStatus, borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
  overflow: 'hidden', opacity: isMounted ? 1 : 0, transform: `translateY(${isMounted ? 0 : 20}px)`,
  transition: '0.6s all ease-out'
}), ['isMounted', 'mounted']))
const Title = styled(Text)(({
                              theme: {
                                colors
                              }
                            }) => ({
  fontSize: 24, fontWeight: 300, textAlign: 'center', color: colors.text, marginBottom: 16
}))
const Version = styled(Text)(({
                                theme: {
                                  colors
                                }
                              }) => ({
  textAlign: 'center', fontSize: 11, fontWeight: 300, color: colors.textStatus, marginBottom: 60
}))
const Item = styled(FlexRow)(styleCreator(({
                                             iconColor, theme: {
    colors
  }
                                           }) => ({
  ...makeTransition(['background-color']), backgroundColor: Transparent, padding: 10, cursor: 'pointer',
  alignItems: 'center', borderTop: `1px solid ${colors.border}`, '&:hover, &:focus, &:active': {
    backgroundColor: lighten(colors.backgroundStatus, 0.15), textDecoration: 'none', '& .icon': {
      ...(!iconColor ? {} : {
        color: lighten(iconColor, 0.3), backgroundColor: lighten(iconColor, 0.3)
      })
    }
  }
}), ['iconColor']))
const ItemTitle = styled(Text)(({
                                  theme: {
                                    colors
                                  }
                                }) => ({
  color: colors.text, fontSize: 15
}))
const ItemSubTitle = styled(Text)(({
                                     theme: {
                                       colors
                                     }
                                   }) => ({
  color: colors.textStatus, fontSize: 11, marginTop: 2
}))
const Icon = styled(Glyph)(({
                              color
                            }) => ({
  ...(!color ? {} : {
    color, backgroundColor: color
  }), ...makeTransition(['background-color']), marginRight: 11, marginLeft: 6
}))
const Logo = styled('img')({
  width: 128, height: 128, alignSelf: 'center', marginTop: 50, marginBottom: 20
})
type Props = ThemeProps<{}, string, true>;
type State = {
  isMounted:boolean;
};
export default withTheme()(class WelcomeScreen extends PureComponent<Props, State> {
  state = {
    isMounted: false
  }
  timer:number | null | undefined
  
  componentDidMount() {
    // waiting sometime before showing the welcome screen to allow Stato to
    // connect to devices, if there are any
    this.timer = (setTimeout as any)(() => {
      this.setState({
        isMounted: true
      })
      this.timer = null
    }, 2000)
  }
  
  componentWillUnmount() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }
  
  render() {
    const {
      theme
    } = this.props, {
      colors
    } = theme
    return <Container>
      <Welcome isMounted={this.state.isMounted}>
        <Logo src={require("!!file-loader!assets/icon.png")}/>
        
        <Title>Welcome to Stato</Title>
        <Version>
          {isProduction() ? `Version ${remote.app.getVersion()}` : 'Development Mode'}
        </Version>
        <Item
          iconColor={colors.accent}
          onClick={() => shell.openExternal('https://fbstates.com/docs/understand.html')}>
          <Icon
            size={20}
            name="rocket"
            className="icon"
            color={colors.accent}
          />
          <FlexColumn>
            <ItemTitle>Using Stato</ItemTitle>
            <ItemSubTitle>
              Learn how Stato can help you debug your App
            </ItemSubTitle>
          </FlexColumn>
        </Item>
        <Item iconColor={colors.accent}
              onClick={() => shell.openExternal('https://fbstates.com/docs/create-plugin.html')}>
          <Icon size={20} name="magic-wand" className="icon" color={colors.accent}/>
          <FlexColumn>
            <ItemTitle>Create your own plugin</ItemTitle>
            <ItemSubTitle>Get started with these pointers</ItemSubTitle>
          </FlexColumn>
        </Item>
        <Item iconColor={colors.accent}
              onClick={() => shell.openExternal('https://fbstates.com/docs/getting-started.html')}>
          <Icon size={20} name="tools" className="icon" color={colors.accent}/>
          <FlexColumn>
            <ItemTitle>Add Stato support to your app</ItemTitle>
            <ItemSubTitle>Get started with these pointers</ItemSubTitle>
          </FlexColumn>
        </Item>
        <Item iconColor={colors.accent}
              onClick={() => shell.openExternal('https://github.com/facebook/states/issues')}>
          <Icon size={20} name="posts" className="icon" color={colors.accent}/>
          <FlexColumn>
            <ItemTitle>Contributing and Feedback</ItemTitle>
            <ItemSubTitle>
              Report issues and help us improve Stato
            </ItemSubTitle>
          </FlexColumn>
        </Item>
      </Welcome>
    </Container>
  }
  
})
