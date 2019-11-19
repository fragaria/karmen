import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

const Menu = ({ userState }) => {
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
          <li>
            <Link to="/settings">Settings</Link>
          </li>
        </ul>
      )}
    </nav>
  );
}

export default connect(state => ({
  userState: state.users.currentState,
}))(Menu);