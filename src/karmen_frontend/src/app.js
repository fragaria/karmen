import React from "react";
import dayjs from "dayjs";
import { connect } from "react-redux";
import { BrowserRouter, Switch, Route } from "react-router-dom";

import Menu from "./components/menu";
import Heartbeat from "./components/heartbeat";
import LoginGateway from "./components/login-gateway";
import ForcePwdChangeGateway from "./components/force-pwd-change-gateway";
import Loader from "./components/loader";
import CatchTokenFromUrl from "./components/catch-token-from-url";

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

import { loadUserFromLocalStorage, refreshToken } from "./actions/users";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      initialized: false,
      tokenTimer: null
    };
    this.checkUserAccessToken = this.checkUserAccessToken.bind(this);
  }

  checkUserAccessToken() {
    const { accessTokenExpiresOn, refreshToken } = this.props;
    let doingSomething = Promise.resolve();
    if (
      accessTokenExpiresOn &&
      dayjs().isAfter(accessTokenExpiresOn.subtract(3 * 60, "seconds"))
    ) {
      doingSomething = refreshToken();
    }
    doingSomething.then(() => {
      this.setState({
        timer: setTimeout(this.checkUserAccessToken, 60 * 1000)
      });
    });
  }

  componentDidMount() {
    const { loadUserFromStorage } = this.props;
    const { initialized } = this.state;
    if (!initialized) {
      loadUserFromStorage().then(() => {
        this.setState({
          initialized: true,
          timer: setTimeout(this.checkUserAccessToken, 60 * 1000)
        });
      });
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
      <>
        <BrowserRouter>
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
                  <Route path="/add-user" exact component={AddUser} />
                  <Route path="/add-printer" exact component={AddPrinter} />
                  <Route path="/add-gcode" exact component={AddGcode} />
                  <Route path="/settings" exact component={Settings} />
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
      </>
    );
  }
}

export default connect(
  state => ({
    accessTokenExpiresOn: state.users.me.accessTokenExpiresOn
  }),
  dispatch => ({
    loadUserFromStorage: () => dispatch(loadUserFromLocalStorage()),
    refreshToken: () => dispatch(refreshToken())
  })
)(App);
