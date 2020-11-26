import React from "react";
import { connect } from "react-redux";
import { Route, Switch, Redirect } from "react-router-dom";
import { RoutedTabs, NavTab } from "react-router-tabs";

import ApiTokensTab from "../../components/tabs/user/api-tokens-tab";
import AccountTab from "../../components/tabs/user/account-tab";

import {
  loadUserApiTokens,
  deleteUserApiToken,
  changePassword,
} from "../../actions/users-me";

const UserPreferences = ({ match, ...rest }) => {
  return (
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
        <NavTab to="/tab-account">Account</NavTab>
        <NavTab to="/tab-api-tokens">API tokens</NavTab>
      </RoutedTabs>

      <Switch>
        <Route
          exact
          path={`${match.url}`}
          render={() => <Redirect replace to={`${match.url}/tab-account`} />}
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
    onTokenDelete: (token_id) => dispatch(deleteUserApiToken(token_id)),
    changePassword: (password, new_password, new_password_confirmation) =>
      dispatch(
        changePassword(password, new_password, new_password_confirmation)
      ),
  })
)(UserPreferences);
