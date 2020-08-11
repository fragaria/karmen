import React from "react";
import { Route, Redirect } from "react-router-dom";

const UnauthenticatedRoute = ({ userState, ...rest }) => {
  if (userState !== "logged-out") {
    return <Redirect to="/" />;
  }
  return <Route {...rest} />;
};

export default UnauthenticatedRoute;
