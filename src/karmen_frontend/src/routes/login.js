import React from "react";
import { connect } from "react-redux";
import LoginForm from "../components/forms/login-form";
import { authenticate } from "../actions/users-me";
import { Redirect } from "react-router-dom";

const Login = ({ userState, doAuthenticate }) => {
  if (userState !== "logged-out") {
    return <Redirect to="/" />;
  }

  return <LoginForm doAuthenticate={doAuthenticate} />;
};

export default connect(
  state => ({
    userState: state.users.me.currentState
  }),
  dispatch => ({
    doAuthenticate: (username, password) =>
      dispatch(authenticate(username, password))
  })
)(Login);
