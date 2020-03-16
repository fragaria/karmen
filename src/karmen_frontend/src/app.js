import React, { useEffect } from "react";
import { connect } from "react-redux";
import { BrowserRouter, Switch, Route, useLocation } from "react-router-dom";

import Menu from "./components/menu";
import Loader from "./components/utils/loader";
import Heartbeat from "./components/gateways/heartbeat";
import CatchLoginTokenFromUrl from "./components/gateways/catch-login-token-from-url";
import AuthenticatedRoute from "./components/authenticated-route";
import UnauthenticatedRoute from "./components/unauthenticated-route";
import ForceLogoutRoute from "./components/force-logout-route";

import Login from "./routes/unauthorized/login";
import Register from "./routes/unauthorized/register";
import RegisterConfirmation from "./routes/unauthorized/register-confirmation";
import RequestPasswordReset from "./routes/unauthorized/request-password-reset";
import ResetPassword from "./routes/unauthorized/reset-password";
import OrganizationRoot from "./routes/organizations/organization-root";
import OrganizationSettings from "./routes/organizations/organization-settings";
import OrganizationProperties from "./routes/organizations/organization-properties";
import AddPrinter from "./routes/organizations/add-printer";
import AddUser from "./routes/organizations/add-user";
import PrinterList from "./routes/printers/printer-list";
import PrinterDetail from "./routes/printers/printer-detail";
import PrinterSettings from "./routes/printers/printer-settings";
import GcodeList from "./routes/gcodes/gcode-list";
import GcodeDetail from "./routes/gcodes/gcode-detail";
import AddGcode from "./routes/gcodes/add-gcode";
import AddApiToken from "./routes/user/add-api-token";
import UserPreferences from "./routes/user/user-preferences";
import ManageOrganizations from "./routes/manage-organizations";
import AddOrganization from "./routes/add-organization";
import Page404 from "./routes/page404";
import AppRoot from "./routes/app-root";

import {
  loadUserFromLocalStorage,
  clearUserIdentity
} from "./actions/users-me";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      initialized: false,
      tokenTimer: null
    };
    this.myRef = React.createRef();
  }

  componentDidMount() {
    const { loadUserFromStorage } = this.props;
    const { initialized } = this.state;
    if (!initialized) {
      loadUserFromStorage().then(() => {
        this.setState({
          initialized: true
        });
      });
    } else {
      this.myRef.current.scrollTo(0, 0);
    }
  }

  componentWillUnmount() {
    const { timer } = this.state;
    timer && clearTimeout(timer);
  }

  render() {
    const { initialized } = this.state;
    const { userState, logout } = this.props;
    if (!initialized) {
      return (
        <div>
          <Loader />
        </div>
      );
    }
    return (
      <div ref={this.myRef}>
        <BrowserRouter>
          <ScrollToTop />
          <CatchLoginTokenFromUrl />
          <Menu />
          <Heartbeat />
          <main className="main">
            <Switch>
              <Route path="/page-404" exact component={Page404} />
              <UnauthenticatedRoute
                userState={userState}
                path="/login"
                exact
                component={Login}
              />
              <UnauthenticatedRoute
                userState={userState}
                path="/register"
                exact
                component={Register}
              />
              <ForceLogoutRoute
                userState={userState}
                logout={logout}
                path="/confirmation"
                exact
                component={RegisterConfirmation}
              />
              <ForceLogoutRoute
                userState={userState}
                logout={logout}
                path="/reset-password"
                exact
                component={ResetPassword}
              />
              <UnauthenticatedRoute
                userState={userState}
                path="/request-password-reset"
                exact
                component={RequestPasswordReset}
              />
              <AuthenticatedRoute
                userState={userState}
                path="/users/me/tokens"
                exact
                component={AddApiToken}
              />
              <AuthenticatedRoute
                userState={userState}
                path="/users/me"
                component={UserPreferences}
              />
              <AuthenticatedRoute
                userState={userState}
                path="/organizations"
                exact
                component={ManageOrganizations}
              />
              <AuthenticatedRoute
                userState={userState}
                path="/organizations/:orguuid/settings"
                exact
                component={OrganizationProperties}
              />
              <AuthenticatedRoute
                userState={userState}
                path="/add-organization"
                exact
                component={AddOrganization}
              />
              <AuthenticatedRoute
                userState={userState}
                path="/:orguuid/settings"
                component={OrganizationSettings}
              />
              <AuthenticatedRoute
                userState={userState}
                path="/:orguuid/add-user"
                exact
                component={AddUser}
              />
              <AuthenticatedRoute
                userState={userState}
                path="/:orguuid/add-printer"
                exact
                component={AddPrinter}
              />
              <AuthenticatedRoute
                userState={userState}
                path="/:orguuid/add-gcode"
                exact
                component={AddGcode}
              />
              <AuthenticatedRoute
                userState={userState}
                path="/:orguuid/gcodes/:uuid"
                exact
                component={GcodeDetail}
              />
              <AuthenticatedRoute
                userState={userState}
                path="/:orguuid/gcodes"
                exact
                component={GcodeList}
              />
              <AuthenticatedRoute
                userState={userState}
                path="/:orguuid/printers/:uuid/settings"
                exact
                component={PrinterSettings}
              />
              <AuthenticatedRoute
                userState={userState}
                path="/:orguuid/printers/:uuid"
                component={PrinterDetail}
              />
              <AuthenticatedRoute
                userState={userState}
                path="/:orguuid/printers"
                exact
                component={PrinterList}
              />
              <AuthenticatedRoute
                userState={userState}
                path="/:orguuid"
                exact
                component={OrganizationRoot}
              />
              <AuthenticatedRoute
                userState={userState}
                path="/"
                exact
                component={AppRoot}
              />
              <Route component={Page404} />
            </Switch>
          </main>
        </BrowserRouter>
        <footer>
          <section>
            &copy; {new Date().getFullYear()}{" "}
            <a
              href="https://fragaria.cz"
              target="_blank"
              rel="noopener noreferrer"
              className="anchor"
            >
              Fragaria s.r.o.
            </a>
          </section>
          <small>
            <a
              href="https://github.com/fragaria/karmen/blob/master/LICENSE.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="anchor"
            >
              License
            </a>{" "}
            <a
              href="https://github.com/fragaria/karmen"
              target="_blank"
              rel="noopener noreferrer"
              className="anchor"
            >
              Source
            </a>{" "}
            <a
              href={`https://github.com/fragaria/karmen/releases/tag/${process.env.REACT_APP_GIT_REV}`}
              target="_blank"
              rel="noopener noreferrer"
              className="anchor"
            >
              {process.env.REACT_APP_GIT_REV}
            </a>
          </small>
        </footer>
      </div>
    );
  }
}

export default connect(
  state => ({
    accessTokenExpiresOn: state.me.accessTokenExpiresOn,
    userState: state.me.currentState
  }),
  dispatch => ({
    loadUserFromStorage: () => dispatch(loadUserFromLocalStorage()),
    logout: () => dispatch(clearUserIdentity())
  })
)(App);
