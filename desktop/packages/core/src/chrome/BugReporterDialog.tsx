/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from "react"
import BugReporter from "../fb-stubs/BugReporter"
import { Fragment } from "react"
import { connect } from "react-redux"
import styled from "../ui/styled"
import FlexColumn from "../ui/components/FlexColumn"
import Glyph from "../ui/components/Glyph"
import Text from "../ui/components/Text"
import Input from "../ui/components/Input"
import Textarea from "../ui/components/Textarea"
import FlexRow from "../ui/components/FlexRow"
import Button from "../ui/components/Button"
import FlexCenter from "../ui/components/FlexCenter"
import {ThemeProps, withTheme} from "../ui/themes"
import {RootState} from "../reducers"
import {Plugin} from "../PluginTypes"
import Link from "../ui/components/Link"
import {oc} from "ts-optchain"

const Container = styled(FlexColumn)({
  padding: 10,
  width: 400,
  height: 300
})
const Icon = styled(Glyph)({
  marginRight: 8,
  marginLeft: 3
})
const Center = styled(Text)({
  textAlign: "center",
  lineHeight: "130%",
  paddingLeft: 20,
  paddingRight: 20
})
const Title = styled("div")({
  fontWeight: 500,
  marginTop: 8,
  marginLeft: 2,
  marginBottom: 8
})
const textareaStyle = {
  margin: 0,
  marginBottom: 10
}
const TitleInput = styled(Input)({ ...textareaStyle, height: 30 })
const DescriptionTextarea = styled(Textarea)({ ...textareaStyle, flexGrow: 1 })
const SubmitButtonContainer = styled("div")({
  marginLeft: "auto"
})
const Footer = styled(FlexRow)({
  lineHeight: "24px"
})
const CloseDoneButton = styled(Button)({
  marginTop: 20,
  marginLeft: "auto !important",
  marginRight: "auto"
})
const InfoBox = styled(FlexRow)({
  marginBottom: 20,
  lineHeight: "130%"
})
type State = {
  description: string,
  title: string,
  submitting: boolean,
  success: number | null | undefined,
  error: string | null | undefined
}

type StateProps = {
  activePlugin: Plugin | null | undefined
}

type OwnProps = {
  bugReporter: BugReporter,
  onHide: () => any
}

type Props = ThemeProps<StateProps & OwnProps,string,true>

const BugReporterDialog = withTheme()(class BugReporterDialog extends React.Component<Props, State> {
  
  titleRef: HTMLElement
  descriptionRef: HTMLElement
  
  constructor(props: Props) {
    super(props)
    
    this.state = {
      description: "",
      title: "",
      submitting: false,
      success: null,
      error: null
    }
  }
  
  
  onDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      description: e.target.value
    })
  }
  onTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      title: e.target.value
    })
  }
  onSubmit = () => {
    // validate fields
    const { title, description } = this.state

    if (!title) {
      this.setState({
        error: "Title required."
      })
      this.titleRef.focus()
      return
    }

    if (!description) {
      this.setState({
        error: "Description required."
      })
      this.descriptionRef.focus()
      return
    }

    this.setState(
      {
        error: null,
        submitting: true
      },
      () => {
        // this will be called before the next repaint
        requestAnimationFrame(() => {
          // we have to call this again to ensure a repaint has actually happened
          // as requestAnimationFrame is called BEFORE a repaint, not after which
          // means we have to queue up twice to actually ensure a repaint has
          // happened
          requestAnimationFrame(() => {
            this.props.bugReporter
              .report(title, description)
              .then((id: number) => {
                this.setState({
                  submitting: false,
                  success: id
                })
              })
              .catch(err => {
                this.setState({
                  error: err.message,
                  submitting: false
                })
              })
          })
        })
      }
    )
  }
  setTitleRef = (ref: HTMLElement) => {
    this.titleRef = ref
  }
  setDescriptionRef = (ref: HTMLElement) => {
    this.descriptionRef = ref
  }
  onCancel = () => {
    this.setState({
      error: null,
      title: "",
      description: ""
    })
    this.props.onHide()
  }

  render() {
    let content
    const
      {activePlugin = {}  as Partial<Plugin>, theme:{colors}} = this.props,
      id = oc(activePlugin).id(null),
      bugs = oc(activePlugin).bugs(null),
      { title, success, error, description, submitting } = this.state

    if (success) {
      content = (
        <FlexCenter grow={true}>
          <FlexColumn>
            <Center>
              <Glyph name="checkmark-circle" size={24} variant="outline" color={colors.accent} />
              <br />
              <Title>Bug Report created</Title>
              The bug report <Link href={`https://our.intern.facebook.com/intern/bug/${success}`}>{success}</Link> was
              successfully created. Thank you for your help making States better!
            </Center>
            <CloseDoneButton onClick={this.onCancel} compact type="primary">
              Close
            </CloseDoneButton>
          </FlexColumn>
        </FlexCenter>
      )
    } else {
      content = (
        <Fragment>
          <Title>Report a bug...</Title>
          <TitleInput
            placeholder="Title..."
            value={title}
            innerRef={this.setTitleRef}
            onChange={this.onTitleChange}
            disabled={submitting}
          />

          <DescriptionTextarea
            placeholder="Describe your problem in as much detail as possible..."
            value={description}
            innerRef={this.setDescriptionRef}
            onChange={this.onDescriptionChange}
            disabled={submitting}
          />
          {bugs && (
            <InfoBox>
              <Icon color={colors.accent} name="info-circle" />
              <span>
                If you bug is related to the{" "}
                <strong>{oc(activePlugin).title(id || null)} plugin</strong>
                {bugs.url && (
                  <span>
                    , you might find useful information about it here:{" "}
                    <Link href={bugs.url || ""}>{bugs.url}</Link>
                  </span>
                )}
                {bugs.email && (
                  <span>
                    , you might also want contact{" "}
                    <Link href={"mailto:" + String(bugs.email)}>
                      {bugs.email}
                    </Link>
                    , the author/oncall of this plugin, directly
                  </span>
                )}
                .
              </span>
            </InfoBox>
          )}

          <Footer>
            {error != null && <Text color={colors.error}>{error}</Text>}
            <SubmitButtonContainer>
              <Button onClick={this.onCancel} disabled={submitting} compact padded>
                Cancel
              </Button>
              <Button type="primary" onClick={this.onSubmit} disabled={submitting} compact padded>
                Submit Report
              </Button>
            </SubmitButtonContainer>
          </Footer>
        </Fragment>
      )
    }

    return <Container>{content}</Container>
  }
})

export default connect<StateProps, {}, OwnProps,RootState>(
  ({
     plugins: { devicePlugins, clientPlugins },
     connections: { selectedPlugin }
  }) => ({
  activePlugin: devicePlugins.get(selectedPlugin) || clientPlugins.get(selectedPlugin)
}))(BugReporterDialog)
