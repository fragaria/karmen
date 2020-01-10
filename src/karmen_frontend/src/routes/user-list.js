import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

import RoleBasedGateway from "../components/role-based-gateway";
import FreshUserRequiredCheck from "../components/fresh-token-required-check";
import UsersTable from "../components/users-table";
import { getUsersPage, clearUsersPages, patchUser } from "../actions/users";

const UserList = ({
  currentUuid,
  hasFreshUser,
  loadUsersPage,
  clearUsersPages,
  userList,
  onUserChange
}) => {
  if (!hasFreshUser) {
    return (
      <RoleBasedGateway requiredRole="admin">
        <FreshUserRequiredCheck />
      </RoleBasedGateway>
    );
  }
  return (
    <RoleBasedGateway requiredRole="admin">
      <div className="standalone-page">
        <header>
          <h1 className="title">Users</h1>
          <Link to="/add-user" className="plain action link">
            <i className="icon icon-plus"></i>&nbsp;
            <span>Add a user</span>
          </Link>
        </header>
        <div>
          <div className="content-section">
            <UsersTable
              currentUuid={currentUuid}
              userList={userList}
              loadUsersPage={loadUsersPage}
              clearUsersPages={clearUsersPages}
              onUserChange={onUserChange}
            />
          </div>
        </div>
      </div>
    </RoleBasedGateway>
  );
};

export default connect(
  state => ({
    hasFreshUser: state.users.me.hasFreshToken,
    userList: state.users.list,
    currentUuid: state.users.me.identity
  }),
  dispatch => ({
    loadUsersPage: (startWith, orderBy, usernameFilter, limit) =>
      dispatch(getUsersPage(startWith, orderBy, usernameFilter, limit)),
    clearUsersPages: () => dispatch(clearUsersPages()),
    onUserChange: (uuid, role, suspended) =>
      dispatch(patchUser(uuid, role, suspended))
  })
)(UserList);
