import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { clearUserIdentity } from '../actions/users'

const Menu = ({ userState, username, role, logout }) => {
  return (
    <nav>
      <h2 className="hidden">Navigation</h2>
      <Link to="/" className="karmen-logo">
        <img alt="Karmen logo" src="/logo.svg" />
      </Link>
      {userState === "logged-in" && (
        <ul className="navigation">
          <li>
            <Link to="/">Printers</Link>
          </li>
          <li>
            <Link to="/gcodes">G-Codes</Link>
          </li>
          {role === "admin" && (
            <li>
              <Link to="/settings">Settings</Link>
            </li>
          )}
          <li>
            <small>
              <Link to="/users/me">{username}</Link>
              {' '}
              <button className="plain" title="Logout" onClick={(e) => {
                e.preventDefault();
                logout();
              }}><i className="icon icon-exit"></i></button>
            </small>
          </li>
        </ul>
      )}
    </nav>
  );
}

export default connect(
  state => ({
    userState: state.users.currentState,
    username: state.users.username,
    role: state.users.role,
  }),
  dispatch => ({
    logout: () => dispatch(clearUserIdentity())
  })
)(Menu);