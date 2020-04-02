import React from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import SetActiveOrganization from "../../components/gateways/set-active-organization";

const OrganizationRoot = ({ organizations, match }) => {
  if (
    !organizations[match.params.orguuid] ||
    match.params.orguuid === "page-404"
  ) {
    return <Redirect to="/page-404" />;
  }
  return (
    <>
      <SetActiveOrganization />
      <Redirect to={`/${match.params.orguuid}/printers`} />
    </>
  );
};

export default connect((state) => ({
  organizations: state.me.organizations,
}))(OrganizationRoot);
