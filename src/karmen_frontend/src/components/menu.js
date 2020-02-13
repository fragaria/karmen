import React from "react";
import { connect } from "react-redux";
import { Link, withRouter } from "react-router-dom";
import { clearUserIdentity } from "../actions/users";

class Menu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      navigation: false
    };
  }

  render() {
    const { history, userState, username, role, logout } = this.props;

    const { navigation } = this.state;

    return (
      <nav className="navigation">
        <div className="navigation-content">
          <h2 className="hidden">Navigation</h2>
          <Link
            to="/"
            className="navigation-brand"
            onClick={() => {
              this.setState({ navigation: false });
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
                        history.push("/");
                        this.setState({ navigation: false });
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
                {!navigation && <span className="navigation-toggle-label">Menu</span>}
              </button>
            </>
          )}
        </div>        
      </nav>
    );
  }
}

export default withRouter(
  connect(
    state => ({
      userState: state.users.me.currentState,
      username: state.users.me.username,
      role: state.users.me.role
    }),
    dispatch => ({
      logout: () => dispatch(clearUserIdentity())
    })
  )(Menu)
);
