import React from "react";
import { connect } from "react-redux";
import ChangePasswordForm from "./change-password-form";
import Loader from "./loader";

const ForcePwdChangeGateway = ({ children, userState, onUserStateChanged }) => {
  if (!userState || userState === "unknown") {
    return (
      <div>
        <Loader />
      </div>
    );
  }
  if (userState === "pwd-change-required") {
    return (
      <section className="content">
        <div className="container">
          <h1 className="main-title text-center">
            Your password needs to be changed
          </h1>
          <ChangePasswordForm onUserStateChanged={onUserStateChanged} />
        </div>
      </section>
    );
  } else {
    return <React.Fragment>{children}</React.Fragment>;
  }
};

export default connect(state => ({
  userState: state.users.me.currentState
}))(ForcePwdChangeGateway);
