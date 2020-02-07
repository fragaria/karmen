import React from "react";
import dayjs from "dayjs";
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
      accessTokenExpiresOn,
      history
    } = this.props;
    if (!userState || userState === "unknown") {
      return (
        <div>
          <Loader />
        </div>
      );
    }
    // Token I have is fresh and will last at least 5 more minutes
    if (
      hasFreshToken &&
      dayjs().isBefore(accessTokenExpiresOn.subtract(5, "minutes"))
    ) {
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
      hasFreshToken: state.users.me.hasFreshToken,
      accessTokenExpiresOn: state.users.me.accessTokenExpiresOn
    }),
    dispatch => ({
      doAuthenticate: (username, password) =>
        dispatch(authenticateFresh(username, password))
    })
  )(FreshTokenGateway)
);
