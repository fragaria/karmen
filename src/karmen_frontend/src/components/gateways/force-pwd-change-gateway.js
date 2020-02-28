import React from "react";
import { connect } from "react-redux";
import ChangePasswordForm from "../forms/change-password-form";
import { changePassword } from "../../actions/users-me";
import Loader from "../utils/loader";

const ForcePwdChangeGateway = ({ children, userState, changePassword }) => {
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
          <ChangePasswordForm changePassword={changePassword} />
        </div>
      </section>
    );
  } else {
    return <React.Fragment>{children}</React.Fragment>;
  }
};

export default connect(
  state => ({
    userState: state.users.me.currentState
  }),
  dispatch => ({
    changePassword: (password, new_password, new_password_confirmation) =>
      dispatch(
        changePassword(password, new_password, new_password_confirmation)
      )
  })
)(ForcePwdChangeGateway);
