import React from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import SetActiveOrganization from "../../components/gateways/set-active-organization";

const OrganizationRoot = ({ organizations, match }) => {
  if (
    !organizations[match.params.orgid] ||
    match.params.orgid === "page-404"
  ) {
    return <Redirect to="/page-404" />;
  }
  return (
    <>
      <SetActiveOrganization />
      <Redirect to={`/${match.params.orgid}/printers`} />
    </>
  );
};

export default connect((state) => ({
  organizations: state.me.organizations,
}))(OrganizationRoot);
