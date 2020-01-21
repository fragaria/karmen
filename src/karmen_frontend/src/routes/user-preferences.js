import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import {
  loadUserState,
  loadUserApiTokens,
  deleteUserApiToken
} from "../actions/users";
import ChangePasswordForm from "../components/change-password-form";
import ApiTokensTable from "../components/api-tokens-table";
import FreshTokenRequiredCheck from "../components/fresh-token-required-check";

const UserPreferences = ({
  loadUser,
  hasFreshToken,
  loadApiTokens,
  apiTokens,
  apiTokensLoaded,
  onTokenDelete
}) => {
  if (!hasFreshToken) {
    return <FreshTokenRequiredCheck />;
  }
  return (
    <div className="content">
      <div className="container">
        <h1 className="main-title">
          API tokens
          <Link to="/users/me/tokens" className="btn btn-sm">
            <span>+ Add a token</span>
          </Link>
        </h1>
        <ApiTokensTable
          loadTokens={loadApiTokens}
          tokens={apiTokens}
          tokensLoaded={apiTokensLoaded}
          onTokenDelete={onTokenDelete}
        />
      </div>
      <div className="container">
        <h1 className="main-title">Change password</h1>
        <ChangePasswordForm
          onUserStateChanged={() => {
            return loadUser().then(() => {
              return loadApiTokens();
            });
          }}
        />
      </div>
    </div>
  );
};

export default connect(
  state => ({
    hasFreshToken: state.users.me.hasFreshToken,
    apiTokens: state.users.me.apiTokens,
    apiTokensLoaded: state.users.me.apiTokensLoaded
  }),
  dispatch => ({
    loadApiTokens: () => dispatch(loadUserApiTokens()),
    loadUser: () => dispatch(loadUserState()),
    onTokenDelete: jti => dispatch(deleteUserApiToken(jti))
  })
)(UserPreferences);
