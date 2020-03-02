import React from "react";
import { connect } from "react-redux";
import LoginForm from "../../components/forms/login-form";
import { authenticate } from "../../actions/users-me";

const Login = ({ userState, doAuthenticate }) => {
  return <LoginForm doAuthenticate={doAuthenticate} />;
};

export default connect(undefined, dispatch => ({
  doAuthenticate: (username, password) =>
    dispatch(authenticate(username, password))
}))(Login);
