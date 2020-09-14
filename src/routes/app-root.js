import React from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import Loader from "../components/utils/loader";
import { switchOrganization } from "../actions";

const AppRoot = ({
  preferredOrganization,
  activeOrganization,
  organizations,
  switchOrganization,
  state,
}) => {
  // This should be catching a situation right after login
  console.log("APP ROOT LOGIN")
    console.log(activeOrganization)
    console.log(organizations)
  if (
    !activeOrganization &&
    organizations &&
    Object.keys(organizations).length > 0
  ) {
    if (preferredOrganization && organizations[preferredOrganization]) {
      switchOrganization(preferredOrganization);
      console.log("SEND HELP!")
    } else {
      const firstOrg = Object.values(organizations)[0];
      switchOrganization(firstOrg.id);
      console.log("switch org ", firstOrg)
      // console.log("redirecting to  ", firstOrg.id)
      //     return <Redirect to={`/${firstOrg.id}`} />;

    }
    console.log("making loader in root")
    console.log(state);
    return <Loader />;
  }
  if (activeOrganization) {
    return <Redirect to={`/${activeOrganization.id}`} />;
  } else {
    return <Redirect to={`/no-organization`} />;
  }
};

export default connect(
  (state) => ({
    preferredOrganization: state.preferences.activeOrganizationId,
    organizations: state.me.organizations,
    activeOrganization: state.me.activeOrganization,
    state: state,
  }),
  (dispatch) => ({
    switchOrganization: (id) =>
      setTimeout(() => {
        dispatch(switchOrganization(id));
      }),
  })
)(AppRoot);
