import React from "react";
import { connect } from "react-redux";
import { authenticate } from "../../actions/users";
import LoginForm from "../forms/login-form";
import Loader from "../utils/loader";

const LoginGateway = ({ children, userState, doAuthenticate }) => {
  if (!userState || userState === "unknown") {
    return (
      <div>
        <Loader />
      </div>
    );
  }
  if (userState === "logged-in" || userState === "pwd-change-required") {
    return <React.Fragment>{children}</React.Fragment>;
  }
  return <LoginForm doAuthenticate={doAuthenticate} />;
};

export default connect(
  state => ({
    userState: state.users.me.currentState,
    username: state.users.me.username
  }),
  dispatch => ({
    doAuthenticate: (username, password) =>
      dispatch(authenticate(username, password))
  })
)(LoginGateway);
