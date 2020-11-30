import React from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";

const OrgRoleBasedGateway = ({ requiredRole, userRole, children, targetOrganizationRole }) => {
  if(targetOrganizationRole){
    // In org list, we allow editing of non-active organizations.
    // For this case, we want to check not against active org role, but against target org role
    userRole = targetOrganizationRole;
  }
  if (requiredRole === userRole) {
    return <React.Fragment>{children}</React.Fragment>;
  }
  return <Redirect to="/" />;
};

export default connect((state) => ({
  userRole: state.me.activeOrganization.role,
}))(OrgRoleBasedGateway);
