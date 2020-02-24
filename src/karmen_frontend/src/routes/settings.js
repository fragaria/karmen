import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

import OrgRoleBasedGateway from "../components/gateways/org-role-based-gateway";
import FreshTokenGateway from "../components/gateways/fresh-token-gateway";
import NetworkScan from "../components/forms/network-scan";
import PrintersTable from "../components/listings/printers-table";
import UsersTable from "../components/listings/users-table";
import { getUsers, patchUser, deleteUser } from "../actions/users";
import { enqueueTask } from "../actions/misc";
import { setNetworkInterface } from "../actions/preferences";
import { loadPrinters, deletePrinter } from "../actions/printers";

const Settings = ({
  currentUuid,
  loadUsers,
  usersLoaded,
  usersList,
  onUserDelete,
  onUserChange,
  loadPrinters,
  printersList,
  printersLoaded,
  onPrinterDelete,
  networkInterface,
  onNetworkInterfaceChange,
  scanNetwork
}) => {
  return (
    <OrgRoleBasedGateway requiredRole="admin">
      <FreshTokenGateway>
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
          {window.env.IS_CLOUD_INSTALL ? (
              <br/>
              )
              : (
                  <div className="container">
                    <br/>
                    <br/>
                    <strong>Network scan</strong>
                    <NetworkScan
                        networkInterface={networkInterface}
                        onNetworkInterfaceChange={onNetworkInterfaceChange}
                        scanNetwork={scanNetwork}
                    />
                  </div>
              )
          }


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
            loadUsers={loadUsers}
            usersList={usersList}
            usersLoaded={usersLoaded}
            onUserDelete={onUserDelete}
            onUserChange={onUserChange}
          />
        </div>
      </FreshTokenGateway>
    </OrgRoleBasedGateway>
  );
};

export default connect(
  state => ({
    usersList: state.users.list,
    usersLoaded: state.users.listLoaded,
    printersList: state.printers.printers,
    printersLoaded: state.printers.printersLoaded,
    currentUuid: state.users.me.identity,
    networkInterface: state.preferences.networkInterface
  }),
  dispatch => ({
    loadPrinters: fields => dispatch(loadPrinters(fields)),
    onPrinterDelete: uuid => dispatch(deletePrinter(uuid)),
    loadUsers: fields => dispatch(getUsers(fields)),
    onUserChange: (uuid, role) => dispatch(patchUser(uuid, role)),
    onUserDelete: uuid => dispatch(deleteUser(uuid)),
    onNetworkInterfaceChange: networkInterface =>
      dispatch(setNetworkInterface(networkInterface)),
    scanNetwork: networkInterface =>
      dispatch(
        enqueueTask("scan_network", { network_interface: networkInterface })
      )
  })
)(Settings);
