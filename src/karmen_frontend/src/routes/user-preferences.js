import React from 'react';
import { connect } from 'react-redux';
import { loadUserState, loadUserApiTokens, freshTokenRequired } from '../actions/users';
import ChangePasswordForm from '../components/change-password-form';

class UserPreferences extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tokensLoaded: false,
      tokens: [],
    }
  }

  componentDidMount() {
    const { tokensLoaded } = this.state;
    const { loadApiTokens, setFreshTokenRequired } = this.props;
    setFreshTokenRequired(); // TODO move to a standalone component, improve copy in loginform-gateway
    if (!tokensLoaded) {
      loadApiTokens()
        .then(() => {
          this.setState({
            tokensLoaded: true
          });
        });
    }
  }

  render () {
    const { loadUser } = this.props;
    const { tokens, tokensLoaded } = this.state;
    const tokensRows = tokens && tokens.map((t) => {
      return <tr key={t.id}>
          <td>{t.jti}</td>
          <td>{t.name}</td>
          <td>{t.created}</td>
          <td>Revoke</td>
        </tr>
    });
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

            {!tokensLoaded
              ? <p className="message-block">Loading...</p>
              : (!tokensRows || tokensRows.length === 0
                ? <p className="message-error message-block">No API tokens found!</p>
                : (
                <table>
                  <thead>
                    <tr>
                      <th style={{"width": "50%"}}>Token</th>
                      <th>Name</th>
                      <th>Created
                      <th>Actions</th>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tokensRows}
                  </tbody>
                  </table>
              ))
            }
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
  null,
  dispatch => ({
    loadApiTokens: () => (dispatch(loadUserApiTokens())),
    loadUser: () => (dispatch(loadUserState())),
    setFreshTokenRequired: () => dispatch(freshTokenRequired),
  })
)(UserPreferences);