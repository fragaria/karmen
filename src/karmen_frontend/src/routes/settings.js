import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

import RoleBasedGateway from "../components/role-based-gateway";
import FreshUserRequiredCheck from "../components/fresh-token-required-check";
import TableWrapper from "../components/table-wrapper";
import TableActionRow from "../components/table-action-row";
import NetworkScan from "../components/network-scan";
import PrintersTable from "../components/printer-list-settings";
import { getUsersPage, clearUsersPages, patchUser } from "../actions/users";
import { loadPrinters, deletePrinter } from "../actions/printers";
import formatters from "../services/formatters";

class UsersTableRow extends React.Component {
  state = {
    showChangeRoleRow: false,
    showSuspendRow: false
  };

  render() {
    const { currentUuid, user, onUserChange } = this.props;
    const { showChangeRoleRow, showSuspendRow } = this.state;

    if (showSuspendRow) {
      return (
        <TableActionRow
          onCancel={() => {
            this.setState({
              showSuspendRow: false
            });
          }}
          onConfirm={() => {
            onUserChange(user.uuid, user.role, !user.suspended).then(() => {
              this.setState({
                showSuspendRow: false
              });
            });
          }}
        >
          Do you really want to {user.suspended ? "allow" : "disallow"}{" "}
          <strong>{user.username}</strong>?
        </TableActionRow>
      );
    }

    if (showChangeRoleRow) {
      return (
        <TableActionRow
          onCancel={() => {
            this.setState({
              showChangeRoleRow: false
            });
          }}
          onConfirm={() => {
            // this will get more complicated, obviously
            const newRole = user.role === "user" ? "admin" : "user";
            onUserChange(user.uuid, newRole, user.suspended).then(() => {
              this.setState({
                showChangeRoleRow: false
              });
            });
          }}
        >
          Do you really want to {user.role === "admin" ? "demote" : "promote"}{" "}
          <strong>{user.username}</strong> to{" "}
          {user.role === "admin" ? "user" : "admin"}?
        </TableActionRow>
      );
    }

    return (
      <div className="list-item">
        <div className="list-item-content">
          <span className="list-item-title">{user.username}</span>
          <span className="list-item-subtitle">
            <span>is </span>
            <strong>{user.role} </strong>
            <span>and </span>
            {formatters.bool(user.suspended) ? (
              <strong className="text-secondary">disabled</strong>
            ) : (
              <strong className="text-success">enabled</strong>
            )}
          </span>
          <span>{user.uuid}</span>
        </div>

        <div className="list-item-cta">
          {currentUuid !== user.uuid && (
            <>
              <button
                className="btn-reset"
                title={user.suspended ? "Allow" : "Disallow"}
                onClick={() => {
                  this.setState({
                    showSuspendRow: true
                  });
                }}
              >
                {user.suspended ? (
                  <i className="icon-check text-success"></i>
                ) : (
                  <i className="icon-close text-secondary"></i>
                )}
              </button>
              <button
                className="btn-reset"
                title="Change role"
                onClick={() => {
                  this.setState({
                    showChangeRoleRow: true
                  });
                }}
              >
                <i className="icon-edit"></i>
              </button>
            </>
          )}
        </div>
      </div>
    );
  }
}

const Settings = ({
  currentUuid,
  hasFreshUser,
  loadUsersPage,
  clearUsersPages,
  userList,
  onUserChange,
  loadPrinters,
  printersList,
  printersLoaded,
  onPrinterDelete
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
      <div className="content user-list">
        <div className="container">
          <h1 className="main-title">
            Printers
            <Link to="/add-printer" className="btn btn-sm">
              <span>+ Add a printer</span>
            </Link>
          </h1>
        </div>
        <PrintersTable
          loadPrinters={loadPrinters}
          printersList={printersList}
          printersLoaded={printersLoaded}
          onPrinterDelete={onPrinterDelete}
        />

        <div className="container">
          <br />
          <br />
          <strong>Network scan</strong>
          <NetworkScan />
        </div>

        <div className="container">
          <h1 className="main-title">
            Users
            <Link to="/add-user" className="btn btn-sm">
              <span>+ Add a user</span>
            </Link>
          </h1>
        </div>

        <TableWrapper
          rowFactory={u => {
            return (
              <UsersTableRow
                key={u.uuid}
                user={u}
                onUserChange={onUserChange}
                currentUuid={currentUuid}
              />
            );
          }}
          itemList={userList}
          sortByColumns={["username", "uuid", "role"]}
          loadPage={loadUsersPage}
          clearItemsPages={clearUsersPages}
        />
      </div>
    </RoleBasedGateway>
  );
};

export default connect(
  state => ({
    hasFreshUser: state.users.me.hasFreshToken,
    userList: state.users.list,
    printersList: state.printers.printers,
    printersLoaded: state.printers.printersLoaded,
    currentUuid: state.users.me.identity
  }),
  dispatch => ({
    loadPrinters: fields => dispatch(loadPrinters(fields)),
    onPrinterDelete: host => dispatch(deletePrinter(host)),
    loadUsersPage: (startWith, orderBy, filter, limit) =>
      dispatch(getUsersPage(startWith, orderBy, filter, limit)),
    clearUsersPages: () => dispatch(clearUsersPages()),
    onUserChange: (uuid, role, suspended) =>
      dispatch(patchUser(uuid, role, suspended))
  })
)(Settings);
