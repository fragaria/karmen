import React from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";

const OrgRoleBasedGateway = ({ requiredRole, userRole, children }) => {
  console.log("OrgRoleGateway", requiredRole, userRole)
  if (requiredRole === userRole) {
    return <React.Fragment>{children}</React.Fragment>;
  }
  return <Redirect to="/" />;
};

export default connect((state) => ({
  userRole: state.me.activeOrganization.role,
}))(OrgRoleBasedGateway);
