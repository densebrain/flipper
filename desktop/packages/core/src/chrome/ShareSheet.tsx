/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from 'react'

import { shareStatoData } from "../fb-stubs/user"
import { exportStore } from "../utils/exportData"
import PropTypes from "prop-types"
import { clipboard } from "electron"
import {getValue} from "typeguard"
import styled from "../ui/styled"
import FlexColumn from "../ui/components/FlexColumn"
import Input from "../ui/components/Input"
import Text from "../ui/components/Text"
import FlexRow from "../ui/components/FlexRow"
import {Spacer} from "../ui/components/Toolbar"
import Button from "../ui/components/Button"
import LoadingIndicator from "../ui/components/LoadingIndicator"
import {SimpleThemeProps, withTheme} from "../ui/themes"
const Container = styled(FlexColumn)({
  padding: 20,
  width: 500
})
const Center = styled(FlexColumn)({
  alignItems: "center",
  paddingTop: 50,
  paddingBottom: 50
})
const Uploading = styled(Text)({
  marginTop: 15
})
const ErrorMessage = styled(Text)({
  display: "block",
  marginTop: 6,
  wordBreak: "break-all",
  whiteSpace: "pre-line",
  lineHeight: 1.35
})
const Copy = styled(Input)({
  marginRight: 0,
  marginBottom: 15
})
const Title = styled(Text)({
  marginBottom: 6
})
const InfoText = styled(Text)({
  lineHeight: 1.35,
  marginBottom: 15
})
const Padder = styled("div")(({ paddingLeft, paddingRight, paddingBottom, paddingTop }:any) => ({
  paddingLeft: paddingLeft || 0,
  paddingRight: paddingRight || 0,
  paddingBottom: paddingBottom || 0,
  paddingTop: paddingTop || 0
}))
type Props = SimpleThemeProps & {
  onHide: () => any
}
type State = {
  errorArray: Array<Error>,
  result:({
            error_class?: string,
            error?: string
          } & {
       statoUrl?: string
      }) | null
}
export default withTheme()(class ShareSheet extends React.Component<Props, State> {
  static contextTypes = {
    store: PropTypes.object.isRequired
  }
  
  state:State = {
    errorArray: [],
    result: null
  }

  async componentDidMount() {
    try {
      const { serializedString, errorArray } = await exportStore((this as any).context.store)
      const result = await shareStatoData(serializedString)
      this.setState({
        errorArray,
        result
      })

      if (result.statoUrl) {
        clipboard.writeText(String(result.statoUrl))
        new Notification("Sharable Stato trace created", {
          body: "URL copied to clipboard",
          requireInteraction: true
        })
      }
    } catch (e) {
      this.setState({
        result: {
          error_class: "EXPORT_ERROR",
          error: e
        }
      })
      return
    }
  }

  render() {
    const {theme:{colors}} = this.props
    return (
      <Container>
        {this.state.result ? (
          <>
            <FlexColumn>
              {getValue(() => this.state.result!!.statoUrl) ? (
                <>
                  <Title bold>Data Upload Successful</Title>
                  <InfoText>
                   Stato's data was successfully uploaded. This URL can be used to share with other Stato users.
                    Opening it will import the data from your trace.
                  </InfoText>
                  <Copy value={this.state.result.statoUrl} />
                  <InfoText>
                    When sharing your Stato link, consider that the captured data might contain sensitve information
                    like access tokens used in network requests.
                  </InfoText>
                  {this.state.errorArray.length > 0 && (
                    <Padder paddingBottom={8}>
                      <FlexColumn>
                        <Title bold>The following errors occurred while exporting your data</Title>
                        {this.state.errorArray.map((e: Error) => {
                          return <ErrorMessage code>{e.toString()}</ErrorMessage>
                        })}
                      </FlexColumn>
                    </Padder>
                  )}
                </>
              ) : (
                <>
                  <Title bold>{this.state.result.error_class || "Error"}</Title>
                  <ErrorMessage code>{this.state.result.error || "The data could not be uploaded"}</ErrorMessage>
                </>
              )}
            </FlexColumn>
            <FlexRow>
              <Spacer />
              <Button compact padded onClick={this.props.onHide}>
                Close
              </Button>
            </FlexRow>
          </>
        ) : (
          <Center>
            <LoadingIndicator size={30} />
            <Uploading bold color={colors.text}>
              Uploading Stato trace...
            </Uploading>
          </Center>
        )}
      </Container>
    )
  }
})
