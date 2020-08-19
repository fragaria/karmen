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
}) => {
  // This should be catching a situation right after login
  if (
    !activeOrganization &&
    organizations &&
    Object.keys(organizations).length > 0
  ) {
    if (preferredOrganization && organizations[preferredOrganization]) {
      switchOrganization(preferredOrganization);
    } else {
      const firstOrg = Object.values(organizations)[0];
      switchOrganization(firstOrg.id);
    }
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
  }),
  (dispatch) => ({
    switchOrganization: (id) => setTimeout(()=>{dispatch(switchOrganization(id))}),
  })
)(AppRoot);
