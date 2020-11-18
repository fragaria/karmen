import React from "react";
import { Link } from "react-router-dom";

import UsersTable from "../../listings/users-table";
import NoPaginationListing from "../../listings/no-pagination-wrapper";

const Users = ({
  orguuid,
  currentId,
  loadUsers,
  loadPendingUsers,
  usersLoaded,
  usersList,
  invitationsList,
  invitationsLoaded,
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
        currentId={currentId}
        loadUsers={loadUsers}
        usersList={usersList}
        usersLoaded={usersLoaded}
        onUserDelete={onUserDelete}
        onUserChange={onUserChange}
        onResendInvitation={onResendInvitation}
        defaultOrderBy={"+username"}
        loadItems={() => loadUsers(["username", "id", "role"])}
        sortByColumns={["username", "id", "role"]}
        filterByColumns={["username"]}
        isUsers={true}
      />

     <div style={{visibility: invitationsList.length ? "visible" : "hidden"}}>
       {/* We need to render the table so invitations loads, but we don't want to show it if there are none
           So we can't just use conditional render based on invitationsList, as it will be always empty*/}
        <div className="container">
          <div className="react-tabs__tab-panel__header">
            <h1 className="react-tabs__tab-panel__header__title">Pending invitations</h1>
          </div>
        </div>

        <UsersTable
          currentId={currentId}
          loadUsers={loadPendingUsers}
          usersList={invitationsList}
          usersLoaded={invitationsLoaded}
          onUserDelete={onUserDelete}
          onUserChange={onUserChange}
          onResendInvitation={onResendInvitation}
          defaultOrderBy={"+email"}
          loadItems={() => loadPendingUsers()}
          sortByColumns={["email", "role"]}
          filterByColumns={["email"]}
          isUsers={false}
        />
     </div>

    </>
  );
};

export default Users;
