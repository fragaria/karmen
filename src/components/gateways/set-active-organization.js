import React from "react";
import { withRouter, Redirect } from "react-router-dom";
import { connect } from "react-redux";
import { switchOrganization } from "../../actions";

const SetActiveOrganization = ({
  match,
  organizations,
  activeOrganization,
  switchOrganization,
}) => {
  if (match.params.orgid) {
    if (!organizations[match.params.orgid]) {
      return <Redirect to="/page-404" />;
    }
    // This should be catching a situation after direct URL access
    if (
      !activeOrganization ||
      activeOrganization.id !== match.params.orgid
    ) {
      switchOrganization(organizations[match.params.orgid].id);
    }
    return <></>;
  }
  return <></>;
};

export default withRouter(
  connect(
    (state) => ({
      organizations: state.me.organizations,
      activeOrganization: state.me.activeOrganization,
    }),
    (dispatch) => ({
      switchOrganization: (id) => dispatch(switchOrganization(id)),
    })
  )(SetActiveOrganization)
);
