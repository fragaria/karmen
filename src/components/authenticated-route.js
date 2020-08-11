import React from "react";
import { Route, Redirect } from "react-router-dom";
import ForcePwdChangeGateway from "./gateways/force-pwd-change-gateway";

const AuthenticatedRoute = ({ userState, ...rest }) => {
  if (userState === "logged-in" || userState === "pwd-change-required") {
    return (
      <ForcePwdChangeGateway>
        <Route {...rest} />
      </ForcePwdChangeGateway>
    );
  }
  return <Redirect to="/login" />;
};

export default AuthenticatedRoute;
