import React from "react";
import dayjs from "dayjs";
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import LoginForm from "../forms/login-form";
import Loader from "../utils/loader";
import { authenticateFresh } from "../../actions/users-me";

const FreshTokenGateway = ({
  children,
  userState,
  username,
  doAuthenticate,
  hasFreshToken,
  accessTokenExpiresOn,
  history
}) => {
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
};

export default withRouter(
  connect(
    state => ({
      userState: state.me.currentState,
      username: state.me.username,
      hasFreshToken: state.me.hasFreshToken,
      accessTokenExpiresOn: state.me.accessTokenExpiresOn
    }),
    dispatch => ({
      doAuthenticate: (username, password) =>
        dispatch(authenticateFresh(username, password))
    })
  )(FreshTokenGateway)
);
