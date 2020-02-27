import React from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";

const OrganizationRoot = ({ activeOrganization }) => {
  return <Redirect to={`/${activeOrganization.slug}`} />;
};

export default connect(state => ({
  activeOrganization: state.users.me.activeOrganization
}))(OrganizationRoot);
