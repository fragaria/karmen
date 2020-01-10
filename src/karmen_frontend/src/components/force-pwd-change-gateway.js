import React from "react";
import { connect } from "react-redux";
import ChangePasswordForm from "./change-password-form";
import Loader from "./loader";

class ForcePwdChangeGateway extends React.Component {
  render() {
    const { children, userState, onUserStateChanged } = this.props;
    if (!userState || userState === "unknown") {
      return (
        <div>
          <Loader />
        </div>
      );
    }
    if (userState === "pwd-change-required") {
      return (
        <div className="standalone-page">
          <header>
            <h1 className="title">Your password needs to be changed</h1>
          </header>
          <ChangePasswordForm onUserStateChanged={onUserStateChanged} />
        </div>
      );
    } else {
      return <React.Fragment>{children}</React.Fragment>;
    }
  }
}

export default connect(state => ({
  userState: state.users.me.currentState
}))(ForcePwdChangeGateway);
