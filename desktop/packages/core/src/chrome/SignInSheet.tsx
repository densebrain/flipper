/**
 * Copyright 2018-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import * as React from "react"
import { writeKeychain, getUser } from '../fb-stubs/user';
import {login, User} from '../reducers/user'
import { connect } from 'react-redux';
import styled from "../ui/styled"
import FlexColumn from "../ui/components/FlexColumn"
import Text from "../ui/components/Text"
import Input from "../ui/components/Input"
import Link from "../ui/components/Link"
import Button from "../ui/components/Button"
import {RootState} from "../reducers"
import {Spacer} from "../ui"
import FlexRow from "../ui/components/FlexRow"
import {SimpleThemeProps, withTheme} from "../ui/themes"
const Container = styled(FlexColumn)({
  padding: 20,
  width: 500
});
const Title = styled(Text)({
  marginBottom: 6,
  fontWeight: 600
});
const InfoText = styled(Text)({
  lineHeight: 1.35,
  marginBottom: 15
});
const TokenInput = styled(Input)({
  marginRight: 0
});
type OwnProps = {
  onHide: () => any;
};

type Actions = {
  login: (user: User) => any;
}
type Props = OwnProps & Actions & SimpleThemeProps;

type State = {
  token: string;
  loading: boolean;
  error: string | null | undefined;
};

const SignInSheet = withTheme()(class SignInSheet extends React.Component<Props, State> {
  
  constructor(props: Props) {
    super(props)
    
    this.state = {
      token: '',
      loading: false,
      error: null
    };
  }
  
  
  saveToken = async () => {
    this.setState({
      loading: true
    });
    const {
      token
    } = this.state;

    if (token) {
      await writeKeychain(token);

      try {
        const user = await getUser();

        if (user) {
          this.props.login(user);
        }

        this.props.onHide();
      } catch (error) {
        console.error(error);
        this.setState({
          token: '',
          loading: false,
          error
        });
      }
    }
  };

  render() {
    const {theme:{colors}} = this.props
    return <Container>
        <Title>You are not currently logged in to Facebook.</Title>
        <InfoText>
          To log in you will need to{' '}
          <Link href="https://our.internmc.facebook.com/intern/oauth/nuclide/">
            open this page
          </Link>
          , copy the Nuclide access token you find on that page, and paste it
          into the text input below.
        </InfoText>
        <TokenInput disabled={this.state.loading} placeholder="Nuclide Access Token" value={this.state.token} onChange={(e: any) => this.setState({
        token: e.target.value
      })} />
        {this.state.error && <InfoText color={colors.errorText}>
            <strong>Error:</strong>&nbsp;{this.state.error}
          </InfoText>}
        <br />
        <FlexRow>
          <Spacer />
          <Button compact padded onClick={this.props.onHide}>
            Cancel
          </Button>
          <Button type="primary" compact padded onClick={this.saveToken}>
            Sign In
          </Button>
        </FlexRow>
      </Container>;
  }

})

export default connect<{}, Actions, OwnProps, RootState>(() => ({}), {
  login
})(SignInSheet);
