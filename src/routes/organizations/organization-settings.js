import React from "react";
import { connect } from "react-redux";
import { Route, Switch, Redirect } from "react-router-dom";
import { RoutedTabs, NavTab } from "react-router-tabs";

import SetActiveOrganization from "../../components/gateways/set-active-organization";
import OrgRoleBasedGateway from "../../components/gateways/org-role-based-gateway";

import UsersTab from "../../components/tabs/settings/users-tab";
import PrintersTab from "../../components/tabs/settings/printers-tab";

import {
  enqueueTask,
  setNetworkInterface,
  loadPrinters,
  patchPrinter,
  deletePrinter,
  addUser,
  getUsers,
  patchUser,
  deleteUser,
} from "../../actions";

const Settings = ({ match, ...rest }) => {
  console.log("making settings");
  return (
    <>
      <SetActiveOrganization />
      <OrgRoleBasedGateway requiredRole="admin">
        <div className="content">
          <div className="container">
            <h1 className="main-title">Settings</h1>
          </div>

          <RoutedTabs
            startPathWith={match.url}
            className="react-tabs__tab-list"
            tabClassName="react-tabs__tab"
            activeTabClassName="react-tabs__tab--selected"
          >
            <NavTab to="/tab-printers">Printers</NavTab>
            <NavTab to="/tab-users">Users</NavTab>
          </RoutedTabs>
          <Switch>
            <Route
              exact
              path={`${match.url}`}
              render={() => (
                <Redirect replace to={`${match.url}/tab-printers`} />
              )}
            />
            <Route
              path={`${match.url}/tab-printers`}
              render={(props) => (
                <PrintersTab {...rest} orguuid={match.params.orgid} />
              )}
            />
            <Route
              path={`${match.url}/tab-users`}
              render={(props) => (
                <UsersTab {...rest} orguuid={match.params.orgid} />
              )}
            />
          </Switch>
        </div>
      </OrgRoleBasedGateway>
    </>
  );
};

export default connect(
  (state, ownProps) => ({
    printersLoaded: state.printers.printersLoaded,
    printersList: state.printers.printers,
    networkInterface:
      state.preferences.orgs[ownProps.match.params.orgid] &&
      state.preferences.orgs[ownProps.match.params.orgid].networkInterface,
    usersList: state.users.list,
    usersLoaded: state.users.listLoaded,
    currentId: state.me.identity,
  }),
  (dispatch, ownProps) => ({
    onPrinterUpdate: (id, newSettings) =>
      dispatch(patchPrinter(ownProps.match.params.orgid, id, newSettings)),
    onPrinterDelete: (id) =>
      dispatch(deletePrinter(ownProps.match.params.orgid, id)),
    loadPrinters: (fields) =>
      dispatch(loadPrinters(ownProps.match.params.orgid, fields)),
    onNetworkInterfaceChange: (networkInterface) =>
      dispatch(setNetworkInterface(networkInterface)),
    scanNetwork: (networkInterface) =>
      dispatch(
        enqueueTask(ownProps.match.params.orgid, "scan_network", {
          network_interface: networkInterface,
        })
      ),
    loadUsers: (fields) =>
      dispatch(getUsers(ownProps.match.params.orgid, fields)),
    onUserChange: (id, role) =>
      dispatch(patchUser(ownProps.match.params.orgid, id, role)),
    onUserDelete: (id) => dispatch(deleteUser(ownProps.match.params.orgid, id)),
    onResendInvitation: (email, role) =>
      dispatch(addUser(ownProps.match.params.orgid, email, role)),
  })
)(Settings);
