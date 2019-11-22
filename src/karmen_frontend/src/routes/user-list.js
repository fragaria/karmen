import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import RoleBasedGateway from '../components/role-based-gateway';
import FreshUserRequiredCheck from '../components/fresh-token-required-check';
import UsersTable from '../components/users-table';
import { getUsersPage, clearUsersPages } from '../actions/users';

const UserList = ({ hasFreshUser, loadUsersPage, clearUsersPages, userList }) => {
  if (!hasFreshUser) {
    return <RoleBasedGateway requiredRole="admin">
      <FreshUserRequiredCheck />
    </RoleBasedGateway>
  }
  return (
    <RoleBasedGateway requiredRole="admin">
      <div className="standalone-page">
        <header>
          <h1 className="title">Users</h1>
        </header>
        <div>
          <div className="content-section">
            <header>
              <h2 className="title">Users</h2>
                <Link to="/add-user" className="plain action link">
                  <i className="icon icon-plus"></i>&nbsp;
                  <span>Add a user</span>
                </Link>
            </header>
            <UsersTable
              userList={userList}
              loadUsersPage={loadUsersPage}
              clearUsersPages={clearUsersPages}
            />
          </div>
          <div className="content-section">
            <h2>Patch a user ??</h2>
            
          </div>
        </div>
      </div>
    </RoleBasedGateway>
  );
}

export default connect(
  state => ({
    hasFreshUser: state.users.me.hasFreshToken,
    userList: state.users.list,
  }),
  dispatch => ({
    loadUsersPage: (startWith, orderBy, usernameFilter, limit) => (dispatch(getUsersPage(startWith, orderBy, usernameFilter, limit))),
    clearUsersPages: () => dispatch(clearUsersPages()),
    //onUserChange: (jti) => (dispatch(patchUser(jti))),
  })
)(UserList);