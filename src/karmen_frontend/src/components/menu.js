import React from "react";
import { connect } from "react-redux";
import { Link, withRouter } from "react-router-dom";
import { clearUserIdentity, switchOrganization } from "../actions/users-me";

class Menu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      navigation: false,
      orgListExpanded: false
    };
  }

  render() {
    const OrganizationSwitch = ({
      children,
      activeOrganization,
      onToggle,
      expanded
    }) => {
      return (
        <div className="dropdown">
          <button
            className="dropdown-toggle btn-reset"
            onClick={e => {
              e.preventDefault();
              onToggle && onToggle();
            }}
          >
            {activeOrganization && activeOrganization.name}
            <span className="icon-down"></span>
          </button>

          {expanded && (
            <div className="dropdown-items">
              <div className="dropdown-items-content">
                <span className="dropdown-title">Switch organization</span>
                {children}
              </div>
              <div className="dropdown-backdrop" onClick={onToggle}></div>
            </div>
          )}
        </div>
      );
    };

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
    const { navigation, orgListExpanded } = this.state;
    const orgList = organizations
      ? Object.values(organizations)
          .filter(o => (o.uuid !== activeOrganization.uuid))
          .sort((o, p) =>
            o.name.toLowerCase() < p.name.toLowerCase() ? -1 : 1
          )
          .map(o => {
            return (
              <button
                className="dropdown-item"
                key={o.uuid}
                onClick={() => {
                  switchOrganization(o.uuid);
                  this.setState({ orgListExpanded: false });
                  history.push(`/${o.uuid}`);
                }}
              >
                {o.name}
              </button>
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
            {userState === "logged-in" && Object.values(organizations).length > 1 && (
              <OrganizationSwitch
                activeOrganization={activeOrganization}
                onToggle={() => {
                  this.setState(prevState => ({
                    orgListExpanded: !prevState.orgListExpanded
                  }));
                }}
                expanded={orgListExpanded}
              >
                {orgList}
              </OrganizationSwitch>
            )}
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
                        {Object.values(organizations).length > 1 ? activeOrganization.name : " "}
                      </p>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to={`/${activeOrganization.uuid}/printers`}
                      onClick={() => this.setState({ navigation: false })}
                    >
                      Printers
                    </Link>
                  </li>
                  <li>
                    <Link
                      to={`/${activeOrganization.uuid}/gcodes`}
                      onClick={() => this.setState({ navigation: false })}
                    >
                      G-Codes
                    </Link>
                  </li>
                  {role === "admin" && (
                    <li>
                      <Link
                        to={`/${activeOrganization.uuid}/settings`}
                        onClick={() => this.setState({ navigation: false })}
                      >
                        Settings
                      </Link>
                    </li>
                  )}
                  <li>
                    <Link
                      to="/organizations"
                      onClick={() => this.setState({ navigation: false })}
                    >
                      Organizations
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
                {!navigation && (
                  <span className="navigation-toggle-label">
                    <span className="icon-menu"></span>
                    <span className="hidden-xs">Menu</span>
                  </span>
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
      switchOrganization: uuid => dispatch(switchOrganization(uuid))
    })
  )(Menu)
);
