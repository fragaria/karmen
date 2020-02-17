import React from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";

const OrgRoleBasedGateway = ({ requiredRole, userRole, children }) => {
  if (requiredRole === userRole) {
    return <React.Fragment>{children}</React.Fragment>;
  }
  return <Redirect to="/" />;
};

export default connect(state => ({
  userRole: state.users.me.activeOrganization.role
}))(OrgRoleBasedGateway);
