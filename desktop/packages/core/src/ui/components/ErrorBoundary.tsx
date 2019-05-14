/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import ErrorBlock from "./ErrorBlock"
import { Component } from "react"
import Heading from "./Heading"
import Button from "./Button"
import View from "./View"
import styled from "../styled/index"
import {Logger} from "../../fb-interfaces/Logger"
import * as React from 'react'
const ErrorBoundaryContainer = styled(View)({
  overflow: "auto",
  padding: 10
})
const ErrorBoundaryStack = styled(ErrorBlock)({
  marginBottom: 10,
  whiteSpace: "pre"
})
type ErrorBoundaryProps = {
  buildHeading?: (err: Error) => string,
  heading?: string,
  showStack?: boolean,
  children?: React.ReactNode
  logger?: Logger
}
type ErrorBoundaryState = {
  error: Error | null | undefined
}
/**
 * Boundary catching errors and displaying an ErrorBlock instead.
 */

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps, context: Object) {
    super(props, context)
    this.state = {
      error: null
    }
  }

  componentDidCatch(err: Error) {
    console.error(err.toString(), "ErrorBoundary")
    this.setState({
      error: err
    })
  }

  clearError = () => {
    this.setState({
      error: null
    })
  }

  render() {
    const { error } = this.state

    if (error) {
      const { buildHeading, showStack } = this.props
      let { heading } = this.props

      if (buildHeading) {
        heading = buildHeading(error)
      }

      if (heading == null) {
        heading = "An error has occured"
      }

      return (
        <ErrorBoundaryContainer grow>
          <Heading>{heading}</Heading>
          {showStack !== false && <ErrorBoundaryStack error={error} />}
          <Button onClick={this.clearError}>Clear error and try again</Button>
        </ErrorBoundaryContainer>
      )
    } else {
      return this.props.children || null
    }
  }
}
