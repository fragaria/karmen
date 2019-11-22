import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { loadUserState, loadUserApiTokens, deleteUserApiToken } from '../actions/users';
import ChangePasswordForm from '../components/change-password-form';
import ApiTokensTable from '../components/api-tokens-table';
import FreshTokenRequiredCheck from '../components/fresh-token-required-check';

const UserPreferences = ({ loadUser, hasFreshToken, loadApiTokens, apiTokens, apiTokensLoaded, onTokenDelete }) => {
  console.log(apiTokens)
  if (!hasFreshToken) {
    return <FreshTokenRequiredCheck />
  }
  return (
    <div className="standalone-page">
      <header>
        <h1 className="title">User preferences</h1>
      </header>
      <div>
        <div className="content-section">
          <header>
            <h2 className="title">API tokens</h2>
              <Link to="/users/me/tokens" className="plain action link">
                <i className="icon icon-plus"></i>&nbsp;
                <span>Add a token</span>
              </Link>
          </header>
          <ApiTokensTable
            loadTokens={loadApiTokens}
            tokens={apiTokens}
            tokensLoaded={apiTokensLoaded}
            onTokenDelete={onTokenDelete}
          />
        </div>
        <div className="content-section">
          <h2>Change password</h2>
          <ChangePasswordForm onUserStateChanged={loadUser} />
        </div>
      </div>
    </div>
  );
}

export default connect(
  state => ({
    hasFreshToken: state.users.me.hasFreshToken,
    apiTokens: state.users.me.apiTokens,
    apiTokensLoaded: state.users.me.apiTokensLoaded,
  }),
  dispatch => ({
    loadApiTokens: () => (dispatch(loadUserApiTokens())),
    loadUser: () => (dispatch(loadUserState())),
    onTokenDelete: (jti) => (dispatch(deleteUserApiToken(jti))),
  })
)(UserPreferences);