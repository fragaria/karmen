import React from "react";
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import { loadUserFromToken } from "../../actions";

const CatchLoginTokenFromUrl = ({
  history,
  location,
  userState,
  loadUserFromToken,
}) => {
  const params = new URLSearchParams(location.search);
  if (params.has("token")) {
    if (userState !== "logged-in") {
      loadUserFromToken(params.get("token"));
    }
    params.delete("token");
    history.push({
      search: `?${params.toString()}`,
    });
  }
  return <></>;
};

export default withRouter(
  connect(
    (state) => ({
      userState: state.me.currentState,
    }),
    (dispatch) => ({
      loadUserFromToken: (accessToken) =>
        dispatch(loadUserFromToken(accessToken)),
    })
  )(CatchLoginTokenFromUrl)
);
