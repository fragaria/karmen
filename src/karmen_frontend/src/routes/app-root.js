import React from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import Loader from "../components/utils/loader";
import { switchOrganization } from "../actions/users-me";

const AppRoot = ({
  preferredOrganization,
  activeOrganization,
  organizations,
  switchOrganization
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
      switchOrganization(firstOrg.uuid);
    }
    return <Loader />;
  }
  return <Redirect to={`/${activeOrganization.uuid}`} />;
};

export default connect(
  state => ({
    preferredOrganization: state.preferences.activeOrganizationUuid,
    organizations: state.me.organizations,
    activeOrganization: state.me.activeOrganization
  }),
  dispatch => ({
    switchOrganization: uuid => dispatch(switchOrganization(uuid))
  })
)(AppRoot);
