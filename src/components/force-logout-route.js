import React from "react";
import { Route } from "react-router-dom";

const ForceLogoutRoute = ({ userState, logout, ...rest }) => {
  if (userState !== "logged-out") {
    logout();
  }
  return <Route {...rest} />;
};

export default ForceLogoutRoute;
