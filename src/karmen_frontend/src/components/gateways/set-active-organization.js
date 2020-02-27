import React from "react";
import { withRouter, Redirect } from "react-router-dom";
import { connect } from "react-redux";
import { switchOrganization } from "../../actions/users-me";

const SetActiveOrganization = ({
  match,
  organizations,
  activeOrganization,
  switchOrganization
}) => {
  if (match.params.orgslug) {
    if (!organizations[match.params.orgslug]) {
      return <Redirect to="/page-404" />;
    }
    if (activeOrganization.slug !== match.params.orgslug) {
      switchOrganization(
        organizations[match.params.orgslug].uuid,
        match.params.orgslug
      );
    }
    return <></>;
  }
  return <></>;
};

export default withRouter(
  connect(
    state => ({
      organizations: state.users.me.organizations,
      activeOrganization: state.users.me.activeOrganization
    }),
    dispatch => ({
      switchOrganization: (uuid, slug) =>
        dispatch(switchOrganization(uuid, slug))
    })
  )(SetActiveOrganization)
);
