import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";

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
        <div className="content">
          <div className="container">
            <h1 className="main-title">Settings</h1>
          </div>
          <Tabs>
            <TabList>
              <Tab>Printers</Tab>
              <Tab>Users</Tab>
            </TabList>
            <TabPanel>
              <div className="container">
                <div className="react-tabs__tab-panel__header">
                  <h1 className="react-tabs__tab-panel__header__title">
                    Printers
                  </h1>
                  <Link to="/add-printer" className="btn btn-sm">
                    <span>+ Add a printer</span>
                  </Link>
                </div>
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
                <NetworkScan
                  networkInterface={networkInterface}
                  onNetworkInterfaceChange={onNetworkInterfaceChange}
                  scanNetwork={scanNetwork}
                />
              </div>
            </TabPanel>

            <TabPanel>
              <div className="container">
                <div className="react-tabs__tab-panel__header">
                  <h1 className="react-tabs__tab-panel__header__title">
                    Users
                  </h1>
                  <Link to="/add-user" className="btn btn-sm">
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
              />
            </TabPanel>
          </Tabs>
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
