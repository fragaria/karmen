import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";

import { loadUserApiTokens, deleteUserApiToken } from "../actions/users-me";
import ChangePasswordForm from "../components/forms/change-password-form";
import ApiTokensTable from "../components/listings/api-tokens-table";
import FreshTokenGateway from "../components/gateways/fresh-token-gateway";

const UserPreferences = ({
  loadApiTokens,
  apiTokens,
  apiTokensLoaded,
  onTokenDelete
}) => {
  return (
    <FreshTokenGateway>
      <div className="content">
        <div className="container">
          <h1 className="main-title">Account Settings</h1>
        </div>

        <Tabs>
          <TabList>
            <Tab>API tokens</Tab>
            <Tab>Account</Tab>
          </TabList>

          <TabPanel>
            <div className="container">
              <div className="react-tabs__tab-panel__header">
                <h1 className="react-tabs__tab-panel__header__title">
                  API tokens
                </h1>
                <Link to="/users/me/tokens" className="btn btn-sm">
                  <span>+ Add a token</span>
                </Link>
              </div>
            </div>

            <ApiTokensTable
              loadTokens={loadApiTokens}
              tokens={apiTokens}
              tokensLoaded={apiTokensLoaded}
              onTokenDelete={onTokenDelete}
            />
          </TabPanel>

          <TabPanel>
            <div className="container">
              <div className="react-tabs__tab-panel__header">
                <h1 className="react-tabs__tab-panel__header__title">
                  Change password
                </h1>
              </div>
            </div>

            <ChangePasswordForm
              onUserStateChanged={() => {
                return loadApiTokens();
              }}
            />
          </TabPanel>
        </Tabs>
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
