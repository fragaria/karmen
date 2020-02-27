import React from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";

const OrganizationRoot = ({ match }) => {
  return <Redirect to={`/${match.params.orgslug}/printers`} />;
};

export default connect()(OrganizationRoot);
