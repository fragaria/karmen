import React from "react";
import { connect } from "react-redux";
import { Link, withRouter } from "react-router-dom";
import { clearUserIdentity, switchOrganization } from "../actions";

class Menu extends React.Component {
  constructor(props) {
    super(props);
    this.dropdownItems = React.createRef();
    this.state = {
      navigation: false,
      orgListExpanded: false,
    };
  }

  componentDidUpdate() {
    const dropdownItems = this.dropdownItems.current;

    const countViewportHeight = (dropdownItems) => {
      const vh = window.innerHeight * 0.01;
      dropdownItems.style.setProperty("--vh", `${vh}px`);
    };

    if (dropdownItems) {
      countViewportHeight(dropdownItems);
      window.addEventListener("resize", () => {
        countViewportHeight(dropdownItems);
      });
    }
  }

  render() {
    const OrganizationSwitch = ({
      children,
      activeOrganization,
      onToggle,
      expanded,
    }) => {
      return (
        <div className="dropdown">
          <button
            className="dropdown-toggle btn-reset"
            onClick={(e) => {
              e.preventDefault();
              onToggle && onToggle();
            }}
          >
            {activeOrganization && activeOrganization.name}
            <span className="icon-down"></span>
          </button>

          {expanded && (
            <div className="dropdown-items" ref={this.dropdownItems}>
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
      logout,
      switchOrganization,
    } = this.props;
    const { navigation, orgListExpanded } = this.state;
    const orgList = organizations
      ? Object.values(organizations)
          .filter((o) => activeOrganization && o.id !== activeOrganization.id)
          .sort((o, p) =>
            o.name.toLowerCase() < p.name.toLowerCase() ? -1 : 1
          )
          .map((o) => {
            return (
              <button
                className="dropdown-item"
                key={o.id}
                onClick={() => {
                  switchOrganization(o.id);
                  this.setState({ orgListExpanded: false });
                  history.push(`/${o.id}`);
                }}
              >
                {o.name}
              </button>
            );
          })
          .filter((o) => !!o)
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
            {!navigation &&
              userState === "logged-in" &&
              Object.values(organizations).length > 1 && (
                <OrganizationSwitch
                  activeOrganization={activeOrganization}
                  onToggle={() => {
                    this.setState((prevState) => ({
                      orgListExpanded: !prevState.orgListExpanded,
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
                  <li className="navigation-title-content">
                    <span className="navigation-title-avatar">
                      <img
                        className="default"
                        alt="Karmen logo"
                        src="/karmen-logo.svg"
                      />
                    </span>
                  </li>

                  {activeOrganization && (
                    //do not print some menu items if user is not a member of organization
                    <>
                      <li className="navigation-item">
                        <Link
                          to={`/${activeOrganization.id}/printers`}
                          onClick={() => this.setState({ navigation: false })}
                          id="navigation-printers"
                        >
                          Printers
                        </Link>
                      </li>
                      <li className="navigation-item">
                        <Link
                          to={`/${activeOrganization.id}/gcodes`}
                          onClick={() => this.setState({ navigation: false })}
                          id="navigation-gcodes"
                        >
                          G-Codes
                        </Link>
                      </li>
                    </>
                  )}
                  <li className="navigation-item">
                    <Link
                      to="/organizations"
                      onClick={() => this.setState({ navigation: false })}
                      id="navigation-organizations"
                    >
                      My organizations
                    </Link>
                  </li>

                  <li className="navigation-title">
                    <p className="navigation-title-content">
                      {username}
                      <span className="icon-settings"></span>
                    </p>
                  </li>

                  <li className="navigation-item">
                    <Link
                      to="/users/me"
                      onClick={() => this.setState({ navigation: false })}
                      id="navigation-organizations"
                    >
                      Account settings
                    </Link>
                  </li>

                  <li className="navigation-item">
                    <Link
                      to={`/${activeOrganization.uuid}/settings/tab-printers`}
                      onClick={() => this.setState({ navigation: false })}
                      id="navigation-organizations"
                    >
                      Printers settings
                    </Link>
                  </li>

                  <li className="navigation-title">
                    <p className="navigation-title-content">
                      {activeOrganization.name}
                      <span className="icon-settings"></span>
                    </p>
                  </li>

                  <li className="navigation-item">
                    <Link
                      to={`/${activeOrganization.id}/settings/tab-printers`}
                      onClick={() => this.setState({ navigation: false })}
                      id="navigation-organizations"
                    >
                      Printers settings
                    </Link>
                  </li>
                  <li className="navigation-item">
                    <Link
                      to={`/${activeOrganization.id}/settings/tab-users`}
                      onClick={() => this.setState({ navigation: false })}
                      id="navigation-organizations"
                    >
                      Users
                    </Link>
                  </li>

                  <li className="navigation-item">
                    <br />
                  </li>

                  <li className="navigation-item">
                    <Link
                      className="btn-reset"
                      title="Logout"
                      onClick={(e) => {
                        e.preventDefault();
                        this.setState({ navigation: false });
                        logout().then(() => history.push("/"));
                      }}
                    >
                      Logout
                    </Link>
                  </li>
                </ul>
              )}

              {activeOrganization && (
                <div className="navigation-items-main">
                  <Link
                    to={`/${activeOrganization.id}/printers`}
                    id="navigation-printers-top"
                    className="navigation-item hidden-xs-inline"
                  >
                    Printers
                  </Link>

                  <Link
                    to={`/${activeOrganization.id}/gcodes`}
                    id="navigation-gcodes-top"
                    className="navigation-item hidden-xs-inline"
                  >
                    G-Codes
                  </Link>

                  <button
                    className="navigation-item navigation-toggle"
                    onClick={(e) => {
                      e.preventDefault();
                      const { navigation } = this.state;
                      this.setState({ navigation: !navigation });
                    }}
                    id="navigation-menu-toggle"
                    role="menu"
                  >
                    {navigation && <span className="icon-close"></span>}
                    {!navigation && (
                      <span className="navigation-toggle-label">
                        <span className="icon-menu"></span>
                      </span>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </nav>
    );
  }
}

export default withRouter(
  connect(
    (state) => ({
      userState: state.me.currentState,
      username: state.me.username,
      activeOrganization: state.me.activeOrganization,
      organizations: state.me.organizations,
      role: state.me.activeOrganization && state.me.activeOrganization.role,
    }),
    (dispatch) => ({
      logout: () => dispatch(clearUserIdentity()),
      switchOrganization: (id) => dispatch(switchOrganization(id)),
    })
  )(Menu)
);
