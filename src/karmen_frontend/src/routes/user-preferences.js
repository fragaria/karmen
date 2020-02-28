import React from "react";
import { connect } from "react-redux";
import { Route, Switch, Redirect } from "react-router-dom";
import { RoutedTabs, NavTab } from "react-router-tabs";

import ApiTokensTab from "../components/tabs/user/api-tokens-tab";
import AccountTab from "../components/tabs/user/account-tab";

import { loadUserApiTokens, deleteUserApiToken } from "../actions/users-me";
import FreshTokenGateway from "../components/gateways/fresh-token-gateway";

const UserPreferences = ({ match, ...rest }) => {
  return (
    <FreshTokenGateway>
      <div className="content">
        <div className="container">
          <h1 className="main-title">Account Settings</h1>
        </div>

        <RoutedTabs
          startPathWith={match.url}
          className="react-tabs__tab-list"
          tabClassName="react-tabs__tab"
          activeTabClassName="react-tabs__tab--selected"
        >
          <NavTab to="/api-tokens">API tokens</NavTab>
          <NavTab to="/account">Account</NavTab>
        </RoutedTabs>

        <Switch>
          <Route
            exact
            path={`${match.url}`}
            render={() => <Redirect replace to={`${match.url}/api-tokens`} />}
          />
          <Route
            path={`${match.url}/api-tokens`}
            render={props => <ApiTokensTab {...rest} />}
          />
          <Route
            path={`${match.url}/account`}
            render={props => <AccountTab {...rest} />}
          />
        </Switch>
      </div>
    </FreshTokenGateway>
  );
};

export default connect(
  state => ({
    apiTokens: state.users.me.apiTokens,
    apiTokensLoaded: state.users.me.apiTokensLoaded
  }),
  dispatch => ({
    loadApiTokens: () => dispatch(loadUserApiTokens()),
    onTokenDelete: jti => dispatch(deleteUserApiToken(jti))
  })
)(UserPreferences);
