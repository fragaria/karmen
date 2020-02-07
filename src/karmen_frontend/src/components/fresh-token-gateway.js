import React from "react";
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import { authenticateFresh } from "../actions/users";
import LoginForm from "./login-form";
import Loader from "./loader";

class FreshTokenGateway extends React.Component {
  render() {
    const {
      children,
      userState,
      username,
      doAuthenticate,
      hasFreshToken,
      history
    } = this.props;
    if (!userState || userState === "unknown") {
      return (
        <div>
          <Loader />
        </div>
      );
    }
    if (hasFreshToken) {
      return <React.Fragment>{children}</React.Fragment>;
    }
    return (
      <LoginForm
        username={username}
        doAuthenticate={doAuthenticate}
        loginInformation={
          <p className="text-center">
            The actions you are about to take need to be authorized by your
            password.
          </p>
        }
        onCancel={() => {
          history.push("/");
        }}
      />
    );
  }
}

export default withRouter(
  connect(
    state => ({
      userState: state.users.me.currentState,
      username: state.users.me.username,
      hasFreshToken: state.users.me.hasFreshToken
    }),
    dispatch => ({
      doAuthenticate: (username, password) =>
        dispatch(authenticateFresh(username, password))
    })
  )(FreshTokenGateway)
);
