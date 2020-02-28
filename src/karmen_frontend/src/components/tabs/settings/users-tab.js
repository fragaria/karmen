import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

import UsersTable from "../../listings/users-table";
import { addUser, getUsers, patchUser, deleteUser } from "../../../actions/users";

const Users = ({
  match,
  currentUuid,
  loadUsers,
  usersLoaded,
  usersList,
  onUserDelete,
  onUserChange,
  onResendInvitation
}) => {
  return (
    <>
      <div className="container">
        <div className="react-tabs__tab-panel__header">
          <h1 className="react-tabs__tab-panel__header__title">
            Users
          </h1>
          <Link
            to={`/${match.params.orgslug}/add-user`}
            className="btn btn-sm"
          >
            <span>+ Add a user</span>
          </Link>
        </div>
      </div>

      <UsersTable
        currentUuid={currentUuid}
        loadUsers={loadUsers}
        usersList={usersList}
        usersLoaded={usersLoaded}
        onUserDelete={onUserDelete}
        onUserChange={onUserChange}
        onResendInvitation={onResendInvitation}
      />
    </>
  )
}

export default connect(
  state => ({
    usersList: state.users.list,
    usersLoaded: state.users.listLoaded,
    currentUuid: state.users.me.identity
  }),
  (dispatch, ownProps) => ({
    loadUsers: fields =>
      dispatch(getUsers(ownProps.match.params.orgslug, fields)),
    onUserChange: (uuid, role) =>
      dispatch(patchUser(ownProps.match.params.orgslug, uuid, role)),
    onUserDelete: uuid =>
      dispatch(deleteUser(ownProps.match.params.orgslug, uuid)),
    onResendInvitation: (email, role) =>
      dispatch(addUser(ownProps.match.params.orgslug, email, role)),
  })
)(Users);
