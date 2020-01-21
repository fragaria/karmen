import React from "react";
import { connect } from "react-redux";
import { setCurrentState } from "../actions/users";

const FreshTokenRequiredCheck = ({ users, setFreshTokenRequired }) => {
  setFreshTokenRequired();
  return <></>;
};

export default connect(null, dispatch => ({
  setFreshTokenRequired: () => dispatch(setCurrentState("fresh-token-required"))
}))(FreshTokenRequiredCheck);
