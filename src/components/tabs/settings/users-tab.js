import React from "react";
import { Link } from "react-router-dom";

import UsersTable from "../../listings/users-table";

const Users = ({
  orguuid,
  currentUuid,
  loadUsers,
  usersLoaded,
  usersList,
  onUserDelete,
  onUserChange,
  onResendInvitation,
}) => {
  return (
    <>
      <div className="container">
        <div className="react-tabs__tab-panel__header">
          <h1 className="react-tabs__tab-panel__header__title">Users</h1>
          <Link to={`/${orguuid}/add-user`} className="btn btn-sm">
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
  );
};

export default Users;
