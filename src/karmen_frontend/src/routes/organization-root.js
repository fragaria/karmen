import React from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";

const OrganizationRoot = ({ organizations, match }) => {
  if (
    !organizations[match.params.orgslug] ||
    match.params.orgslug === "page-404"
  ) {
    return <Redirect to="/page-404" />;
  }
  return <Redirect to={`/${match.params.orgslug}/printers`} />;
};

export default connect(state => ({
  organizations: state.users.me.organizations
}))(OrganizationRoot);
