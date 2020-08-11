import React from "react";
import { connect } from "react-redux";
import { Route, Switch, Redirect } from "react-router-dom";
import { RoutedTabs, NavTab } from "react-router-tabs";

import FreshTokenGateway from "../../components/gateways/fresh-token-gateway";
import ApiTokensTab from "../../components/tabs/user/api-tokens-tab";
import AccountTab from "../../components/tabs/user/account-tab";

import {
  loadUserApiTokens,
  deleteUserApiToken,
  changePassword,
  patchMe,
} from "../../actions/users-me";

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
          <NavTab to="/tab-api-tokens">API tokens</NavTab>
          <NavTab to="/tab-account">Account</NavTab>
        </RoutedTabs>

        <Switch>
          <Route
            exact
            path={`${match.url}`}
            render={() => (
              <Redirect replace to={`${match.url}/tab-api-tokens`} />
            )}
          />
          <Route
            path={`${match.url}/tab-api-tokens`}
            render={(props) => <ApiTokensTab {...rest} />}
          />
          <Route
            path={`${match.url}/tab-account`}
            render={(props) => <AccountTab {...rest} />}
          />
        </Switch>
      </div>
    </FreshTokenGateway>
  );
};

export default connect(
  (state) => ({
    apiTokens: state.me.apiTokens,
    apiTokensLoaded: state.me.apiTokensLoaded,
    username: state.me.username,
    email: state.me.email,
  }),
  (dispatch) => ({
    loadApiTokens: () => dispatch(loadUserApiTokens()),
    onTokenDelete: (jti) => dispatch(deleteUserApiToken(jti)),
    changePassword: (password, new_password, new_password_confirmation) =>
      dispatch(
        changePassword(password, new_password, new_password_confirmation)
      ),
    patchMe: (username, email) => dispatch(patchMe(username, email)),
  })
)(UserPreferences);
