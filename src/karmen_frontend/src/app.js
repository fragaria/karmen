import React from "react";
import { connect } from "react-redux";
import { BrowserRouter, Switch, Route } from "react-router-dom";

import Menu from "./components/menu";
import Heartbeat from "./components/heartbeat";
import LoginGateway from "./components/login-gateway";
import ForcePwdChangeGateway from "./components/force-pwd-change-gateway";
import Loader from "./components/loader";

import PrinterList from "./routes/printer-list";
import GcodeList from "./routes/gcode-list";
import UserList from "./routes/user-list";
import GcodeDetail from "./routes/gcode-detail";
import PrinterDetail from "./routes/printer-detail";
import AddApiToken from "./routes/add-api-token";
import AddPrinter from "./routes/add-printer";
import AddGcode from "./routes/add-gcode";
import AddUser from "./routes/add-user";
import Settings from "./routes/settings";
import UserPreferences from "./routes/user-preferences";

import { loadUserState, setTokenFreshness } from "./actions/users";

import {
  registerAccessTokenExpirationHandler,
  deregisterAccessTokenExpirationHandler
} from "./services/backend";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      initialized: false
    };
  }

  componentDidMount() {
    const { loadUser, setAccessTokenFreshness } = this.props;
    const { initialized } = this.state;
    if (!initialized) {
      loadUser().then(() => {
        this.setState({
          initialized: true
        });
      });
      registerAccessTokenExpirationHandler(60 * 1000, r => {
        setAccessTokenFreshness(r.hasFreshToken);
      });
    }
  }

  componentWillUnmount() {
    deregisterAccessTokenExpirationHandler();
  }

  render() {
    const { loadUser } = this.props;
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
          <Menu />
          <Heartbeat />
          <main className="main">
            <LoginGateway onUserStateChanged={loadUser}>
              <ForcePwdChangeGateway onUserStateChanged={loadUser}>
                <Switch>
                  <Route path="/users" exact component={UserList} />
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
                    path="/printers/:host"
                    exact
                    component={PrinterDetail}
                  />
                  <Route path="/" exact component={PrinterList} />
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

export default connect(null, dispatch => ({
  loadUser: () => dispatch(loadUserState()),
  setAccessTokenFreshness: isFresh => dispatch(setTokenFreshness(isFresh))
}))(App);
