import React from "react";

import { Link, Route, Switch, Redirect } from "react-router-dom";
import { RoutedTabs, NavTab } from "react-router-tabs";
import { renderRoutes } from 'react-router-config';

import SetActiveOrganization from "../components/gateways/set-active-organization";
import OrgRoleBasedGateway from "../components/gateways/org-role-based-gateway";
import FreshTokenGateway from "../components/gateways/fresh-token-gateway";

import UsersTab from "../components/tabs/settings/users-tab.js"
import PrintersTab from "../components/tabs/settings/printers-tab.js"

const Settings = ({
  match
}) => {
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
              startPathWith={match.path}
              tabClassName="tab-link"
              activeTabClassName="active"
            >
              <NavTab to="/printers">Printers</NavTab>
              <NavTab to="/users">Users</NavTab>
            </RoutedTabs>
          </div>
        </FreshTokenGateway>
      </OrgRoleBasedGateway>
    </>
  );
};

export default Settings;
