import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { clearUserIdentity, setCurrentState } from "../actions/users";

class Menu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      navigation: false
    };
  }

  render() {
    const {
      userState,
      username,
      role,
      logout,
      setCurrentUserState
    } = this.props;

    const { navigation } = this.state;

    return (
      <nav className="navigation">
        <h2 className="hidden">Navigation</h2>
        <Link
          to="/"
          className="navigation-brand"
          onClick={() => {
            if (userState === "fresh-token-required") {
              setCurrentUserState("logged-in");
            }
          }}
        >
          <img alt="Karmen logo" src="/karmen-logo.svg" />
        </Link>
        {userState === "logged-in" && (
          <>
            {navigation && (
              <ul className="navigation-items">
                <li>
                  <Link
                    to="/"
                    onClick={() => this.setState({ navigation: false })}
                  >
                    Printers
                  </Link>
                </li>
                <li>
                  <Link
                    to="/gcodes"
                    onClick={() => this.setState({ navigation: false })}
                  >
                    G-Codes
                  </Link>
                </li>
                {role === "admin" && (
                  <li>
                    <Link
                      to="/settings"
                      onClick={() => this.setState({ navigation: false })}
                    >
                      Settings
                    </Link>
                  </li>
                )}
                <li>
                  <Link
                    to="/users/me"
                    onClick={() => this.setState({ navigation: false })}
                  >
                    {username}
                  </Link>
                </li>
                <li>
                  <button
                    className="btn-reset"
                    title="Logout"
                    onClick={e => {
                      e.preventDefault();
                      logout();
                    }}
                  >
                    Logout
                  </button>
                </li>
              </ul>
            )}
            <button
              className="navigation-toggle"
              onClick={e => {
                e.preventDefault();
                const { navigation } = this.state;
                this.setState({ navigation: !navigation });
              }}
            >
              {navigation && <span className="icon-close"></span>}
              {!navigation && <span className="icon-menu"></span>}
            </button>
          </>
        )}
      </nav>
    );
  }
}

export default connect(
  state => ({
    userState: state.users.me.currentState,
    username: state.users.me.username,
    role: state.users.me.role
  }),
  dispatch => ({
    logout: () => dispatch(clearUserIdentity()),
    setCurrentUserState: userState => dispatch(setCurrentState(userState))
  })
)(Menu);
