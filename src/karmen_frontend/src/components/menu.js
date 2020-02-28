import React from "react";
import { connect } from "react-redux";
import { Link, withRouter } from "react-router-dom";
import { clearUserIdentity, switchOrganization } from "../actions/users-me";

class Menu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      navigation: false
    };
  }

  render() {
    const {
      history,
      userState,
      username,
      activeOrganization,
      organizations,
      role,
      logout,
      switchOrganization
    } = this.props;
    const { navigation } = this.state;
    const orgList = organizations
      ? Object.values(organizations)
          .map(o => {
            if (activeOrganization && o.uuid === activeOrganization.uuid) {
              return undefined;
            }
            return (
              <li key={o.uuid}>
                <Link
                  className="navigation-user-organization navigation-user-organization-toggle"
                  to={`/${o.slug}`}
                  onClick={() => {
                    switchOrganization(o.uuid, o.slug);
                    this.setState({ navigation: false });
                  }}
                >
                  Switch to {o.name}
                </Link>
              </li>
            );
          })
          .filter(o => !!o)
      : [];

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
                  <li className="navigation-user">
                    <Link
                      to="/users/me"
                      onClick={() => this.setState({ navigation: false })}
                    >
                      <span className="navigation-user-avatar">
                        <img
                          className="default"
                          alt="Karmen logo"
                          src="/karmen-logo.svg"
                        />
                      </span>
                      {username}
                      <p className="navigation-user-organization">
                        {activeOrganization.name}
                      </p>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to={`/${activeOrganization.slug}/printers`}
                      onClick={() => this.setState({ navigation: false })}
                    >
                      Printers
                    </Link>
                  </li>
                  <li>
                    <Link
                      to={`/${activeOrganization.slug}/gcodes`}
                      onClick={() => this.setState({ navigation: false })}
                    >
                      G-Codes
                    </Link>
                  </li>
                  {role === "admin" && (
                    <li>
                      <Link
                        to={`/${activeOrganization.slug}/settings`}
                        onClick={() => this.setState({ navigation: false })}
                      >
                        Settings
                      </Link>
                    </li>
                  )}
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
                  {orgList}
                  <li>
                    <Link
                      className="navigation-user-organization navigation-user-organization-toggle"
                      to="/organizations"
                      onClick={() => this.setState({ navigation: false })}
                    >
                      Manage organizations
                    </Link>
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
                {!navigation && (
                  <span className="navigation-toggle-label">Menu</span>
                )}
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
      activeOrganization: state.users.me.activeOrganization,
      organizations: state.users.me.organizations,
      role:
        state.users.me.activeOrganization &&
        state.users.me.activeOrganization.role
    }),
    dispatch => ({
      logout: () => dispatch(clearUserIdentity()),
      switchOrganization: (uuid, slug) =>
        dispatch(switchOrganization(uuid, slug))
    })
  )(Menu)
);
