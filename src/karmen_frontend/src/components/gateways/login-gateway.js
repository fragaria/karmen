import React from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import Loader from "../utils/loader";

const LoginGateway = ({ children, userState }) => {
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
  return <Redirect to="/login" />;
};

export default connect(state => ({
  userState: state.users.me.currentState
}))(LoginGateway);
