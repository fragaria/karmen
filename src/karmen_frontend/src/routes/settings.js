import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

import RoleBasedGateway from "../components/role-based-gateway";
import FreshUserRequiredCheck from "../components/fresh-token-required-check";
import UsersTable from "../components/users-table";
import NetworkScan from "../components/network-scan";
import PrintersTable from "../components/printer-list-settings";
import { getUsersPage, clearUsersPages, patchUser } from "../actions/users";
import { loadPrinters, deletePrinter } from "../actions/printers";

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

        <UsersTable
          currentUuid={currentUuid}
          userList={userList}
          loadUsersPage={loadUsersPage}
          clearUsersPages={clearUsersPages}
          onUserChange={onUserChange}
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
    loadUsersPage: (startWith, orderBy, usernameFilter, limit) =>
      dispatch(getUsersPage(startWith, orderBy, usernameFilter, limit)),
    clearUsersPages: () => dispatch(clearUsersPages()),
    onUserChange: (uuid, role, suspended) =>
      dispatch(patchUser(uuid, role, suspended))
  })
)(Settings);
