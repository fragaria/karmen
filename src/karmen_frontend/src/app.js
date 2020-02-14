import React, { useEffect } from "react";
import { connect } from "react-redux";
import { BrowserRouter, Switch, Route, useLocation } from "react-router-dom";

import Menu from "./components/menu";
import Heartbeat from "./components/utils/heartbeat";
import Loader from "./components/utils/loader";
import LoginGateway from "./components/gateways/login-gateway";
import ForcePwdChangeGateway from "./components/gateways/force-pwd-change-gateway";
import CatchTokenFromUrl from "./components/gateways/catch-token-from-url";

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
import Page404 from "./routes/page404";

import { loadUserFromLocalStorage } from "./actions/users";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      initialized: false,
      tokenTimer: null
    };
    this.myRef = React.createRef()
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
            <LoginGateway>
              <ForcePwdChangeGateway>
                <Switch>
                  <Route path="/users/me" exact component={UserPreferences} />
                  <Route
                    path="/users/me/tokens"
                    exact
                    component={AddApiToken}
                  />
                  <Route path="/settings" exact component={Settings} />
                  <Route path="/add-user" exact component={AddUser} />
                  <Route path="/add-printer" exact component={AddPrinter} />
                  <Route path="/add-gcode" exact component={AddGcode} />
                  <Route path="/gcodes" exact component={GcodeList} />
                  <Route path="/gcodes/:id" exact component={GcodeDetail} />
                  <Route
                    path="/printers/:uuid/settings"
                    exact
                    component={PrinterSettings}
                  />
                  <Route
                    path="/printers/:uuid"
                    exact
                    component={PrinterDetail}
                  />
                  <Route path="/" exact component={PrinterList} />
                  <Route component={Page404} />
                </Switch>
              </ForcePwdChangeGateway>
            </LoginGateway>
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
    accessTokenExpiresOn: state.users.me.accessTokenExpiresOn
  }),
  dispatch => ({
    loadUserFromStorage: () => dispatch(loadUserFromLocalStorage())
  })
)(App);
