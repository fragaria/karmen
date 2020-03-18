import React from "react";
import { withRouter, Redirect } from "react-router-dom";
import { connect } from "react-redux";
import { switchOrganization } from "../../actions";

const SetActiveOrganization = ({
  match,
  organizations,
  activeOrganization,
  switchOrganization
}) => {
  if (match.params.orguuid) {
    if (!organizations[match.params.orguuid]) {
      return <Redirect to="/page-404" />;
    }
    // This should be catching a situation after direct URL access
    if (
      !activeOrganization ||
      activeOrganization.uuid !== match.params.orguuid
    ) {
      switchOrganization(organizations[match.params.orguuid].uuid);
    }
    return <></>;
  }
  return <></>;
};

export default withRouter(
  connect(
    state => ({
      organizations: state.me.organizations,
      activeOrganization: state.me.activeOrganization
    }),
    dispatch => ({
      switchOrganization: uuid => dispatch(switchOrganization(uuid))
    })
  )(SetActiveOrganization)
);
