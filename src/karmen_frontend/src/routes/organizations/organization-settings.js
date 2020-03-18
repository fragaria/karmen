import React from "react";
import { connect } from "react-redux";
import { Route, Switch, Redirect } from "react-router-dom";
import { RoutedTabs, NavTab } from "react-router-tabs";

import SetActiveOrganization from "../../components/gateways/set-active-organization";
import OrgRoleBasedGateway from "../../components/gateways/org-role-based-gateway";
import FreshTokenGateway from "../../components/gateways/fresh-token-gateway";

import UsersTab from "../../components/tabs/settings/users-tab";
import PrintersTab from "../../components/tabs/settings/printers-tab";

import {
  enqueueTask,
  setNetworkInterface,
  loadPrinters,
  deletePrinter,
  addUser,
  getUsers,
  patchUser,
  deleteUser
} from "../../actions";

const Settings = ({ match, ...rest }) => {
  return (
    <>
      <SetActiveOrganization />
      <OrgRoleBasedGateway requiredRole="admin">
        <FreshTokenGateway>
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
                render={props => (
                  <PrintersTab {...rest} orguuid={match.params.orguuid} />
                )}
              />
              <Route
                path={`${match.url}/tab-users`}
                render={props => (
                  <UsersTab {...rest} orguuid={match.params.orguuid} />
                )}
              />
            </Switch>
          </div>
        </FreshTokenGateway>
      </OrgRoleBasedGateway>
    </>
  );
};

export default connect(
  (state, ownProps) => ({
    printersLoaded: state.printers.printersLoaded,
    printersList: state.printers.printers,
    networkInterface:
      state.preferences.orgs[ownProps.match.params.orguuid] &&
      state.preferences.orgs[ownProps.match.params.orguuid].networkInterface,
    usersList: state.users.list,
    usersLoaded: state.users.listLoaded,
    currentUuid: state.me.identity
  }),
  (dispatch, ownProps) => ({
    onPrinterDelete: uuid =>
      dispatch(deletePrinter(ownProps.match.params.orguuid, uuid)),
    loadPrinters: fields =>
      dispatch(loadPrinters(ownProps.match.params.orguuid, fields)),
    onNetworkInterfaceChange: networkInterface =>
      dispatch(setNetworkInterface(networkInterface)),
    scanNetwork: networkInterface =>
      dispatch(
        enqueueTask(ownProps.match.params.orguuid, "scan_network", {
          network_interface: networkInterface
        })
      ),
    loadUsers: fields =>
      dispatch(getUsers(ownProps.match.params.orguuid, fields)),
    onUserChange: (uuid, role) =>
      dispatch(patchUser(ownProps.match.params.orguuid, uuid, role)),
    onUserDelete: uuid =>
      dispatch(deleteUser(ownProps.match.params.orguuid, uuid)),
    onResendInvitation: (email, role) =>
      dispatch(addUser(ownProps.match.params.orguuid, email, role))
  })
)(Settings);
