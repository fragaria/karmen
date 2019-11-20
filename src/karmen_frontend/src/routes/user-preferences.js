import React from 'react';
import { connect } from 'react-redux';
import { loadUserState, loadUserApiTokens } from '../actions/users';
import ChangePasswordForm from '../components/change-password-form';
import ApiTokensTable from '../components/api-tokens-table';
import FreshTokenRequiredCheck from '../components/fresh-token-required-check';

class UserPreferences extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tokensLoaded: false,
      tokens: [],
    }
  }

  render () {
    const { loadUser, hasFreshToken, loadApiTokens } = this.props;
    if (!hasFreshToken) {
      return <FreshTokenRequiredCheck />
    }
    return (
      <div className="standalone-page">
        <header>
          <h1 className="title">User preferences</h1>
        </header>
        <div>
          <div>
            <header>
              <h2 className="title">API tokens</h2>
                <button className="plain action link">
                  <i className="icon icon-plus"></i>&nbsp;
                  <span>Add a token</span>
                </button>
            </header>
            <ApiTokensTable loadApiTokens={loadApiTokens} />
          </div>
          <div>
            <h2>Change password</h2>
            <ChangePasswordForm onUserStateChanged={loadUser} />
          </div>
        </div>
      </div>
    );
  }
}

export default connect(
  state => ({
    hasFreshToken: state.users.hasFreshToken
  }),
  dispatch => ({
    loadApiTokens: () => (dispatch(loadUserApiTokens())),
    loadUser: () => (dispatch(loadUserState())),
  })
)(UserPreferences);