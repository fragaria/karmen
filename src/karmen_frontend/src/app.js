import React, { useEffect } from "react";
import { connect } from "react-redux";
import { BrowserRouter, Switch, Route, useLocation } from "react-router-dom";

import Menu from "./components/menu";
import Heartbeat from "./components/utils/heartbeat";
import Loader from "./components/utils/loader";
import CatchTokenFromUrl from "./components/gateways/catch-token-from-url";
import AuthenticatedRoute from "./components/authenticated-route";
import UnauthenticatedRoute from "./components/unauthenticated-route";

import Login from "./routes/login";
import Register from "./routes/register";
import RegisterConfirmation from "./routes/register-confirmation";
import RequestPasswordReset from "./routes/request-password-reset";
import ResetPassword from "./routes/reset-password";
import Page404 from "./routes/page404";
import AppRoot from "./routes/app-root";
import OrganizationRoot from "./routes/organization-root";
import PrinterList from "./routes/printer-list";
import GcodeList from "./routes/gcode-list";
import GcodeDetail from "./routes/gcode-detail";
import PrinterDetail from "./routes/printer-detail";
import PrinterSettings from "./routes/printer-settings";
import AddApiToken from "./routes/add-api-token";
import AddPrinter from "./routes/add-printer";
import AddGcode from "./routes/add-gcode";
import AddUser from "./routes/add-user";
import Settings from "./routes/settings";
import UserPreferences from "./routes/user-preferences";

import { loadUserFromLocalStorage } from "./actions/users-me";

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
    const { userState } = this.props;
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
          <CatchTokenFromUrl />
          <Menu />
          <Heartbeat />
          <main className="main">
            <Switch>
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
              <UnauthenticatedRoute
                userState={userState}
                path="/confirmation"
                exact
                component={RegisterConfirmation}
              />
              <UnauthenticatedRoute
                userState={userState}
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
                path="/users/me"
                exact
                component={UserPreferences}
              />
              <AuthenticatedRoute
                path="/users/me/tokens"
                exact
                component={AddApiToken}
              />
              <AuthenticatedRoute
                userState={userState}
                path="/:orgslug/settings"
                exact
                component={Settings}
              />
              <AuthenticatedRoute
                userState={userState}
                path="/:orgslug/add-user"
                exact
                component={AddUser}
              />
              <AuthenticatedRoute
                userState={userState}
                path="/:orgslug/add-printer"
                exact
                component={AddPrinter}
              />
              <AuthenticatedRoute
                userState={userState}
                path="/:orgslug/add-gcode"
                exact
                component={AddGcode}
              />
              <AuthenticatedRoute
                userState={userState}
                path="/:orgslug/gcodes/:uuid"
                exact
                component={GcodeDetail}
              />
              <AuthenticatedRoute
                userState={userState}
                path="/:orgslug/gcodes"
                exact
                component={GcodeList}
              />
              <AuthenticatedRoute
                userState={userState}
                path="/:orgslug/printers/:uuid/settings"
                exact
                component={PrinterSettings}
              />
              <AuthenticatedRoute
                userState={userState}
                path="/:orgslug/printers/:uuid"
                exact
                component={PrinterDetail}
              />
              <AuthenticatedRoute
                userState={userState}
                path="/:orgslug/printers"
                exact
                component={PrinterList}
              />
              <AuthenticatedRoute
                userState={userState}
                path="/:orgslug"
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
    accessTokenExpiresOn: state.users.me.accessTokenExpiresOn,
    userState: state.users.me.currentState
  }),
  dispatch => ({
    loadUserFromStorage: () => dispatch(loadUserFromLocalStorage())
  })
)(App);
