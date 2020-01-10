import React from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { authenticate, setCurrentState } from '../actions/users';
import { setAccessToken } from '../services/backend';
import { FormInputs } from './form-utils';
import Loader from './loader';

class LoginGateway extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      submitting: false,
      message: null,
      messageOk: false,
      loginForm: {
        username: {
          name: "Username",
          val: props.username || '',
          type: 'text',
          required: true,
        },
        password: {
          name: "Password",
          val: '',
          type: 'password',
          required: true,
        },
      },
    }
    this.login = this.login.bind(this);
  }

  componentDidMount() {
    const { history, location, userState, onUserStateChanged } = this.props;
    const params = new URLSearchParams(location.search);
    if (params.has("token")) {
      if (userState !== "logged-in") {
        setAccessToken(params.get("token"));
        onUserStateChanged();
      }
      params.delete("token");
      history.push({
        search: `?${params.toString()}`
      });
    }
  }

  login(e) {
    e.preventDefault();
    const { loginForm } = this.state;
    const { onUserStateChanged, doAuthenticate } = this.props;
    let hasError = false;
    // eslint-disable-next-line no-unused-vars
    for(let field of Object.values(loginForm)) {
      if (field.required && !field.val) {
        field.error = `${field.name} is required!`;
        hasError = true;
      } else {
        field.error = "";
      }
    }
    if (hasError) {
      this.setState({
        loginForm: Object.assign({}, loginForm),
      })
      return;
    }
    this.setState({
      submitting: true,
    });
    doAuthenticate(loginForm.username.val, loginForm.password.val)
      .then(async (r) => {
        if (r.status !== 200) {
          this.setState({
            messageOk: false,
            message: (r.data && r.data.message) || "Login unsuccessful, try again, please.",
            submitting: false,
            loginForm: Object.assign({}, loginForm, {
              password: Object.assign({}, loginForm.password, { val: '' }),
            })
          });
        } else {
          onUserStateChanged().then(() => {
            this.setState({
              submitting: false,
              message: "",
              messageOk: true,
              loginForm: Object.assign({}, loginForm, {
                password: Object.assign({}, loginForm.password, { val: '' }),
                username: Object.assign({}, loginForm.username, { val: '' }),
              })
            });
          });
        }
      });
  }

  render() {
    const { children, userState, setCurrentUserState, history } = this.props;
    const { message, messageOk, submitting, loginForm } = this.state;
    if (!userState || userState === 'unknown') {
      return <div><Loader /></div>;
    }
    if (userState === "logged-out" || userState === "fresh-token-required") {
      const updateValue = (name, value) => {
        const { loginForm } = this.state;
        this.setState({
          loginForm: Object.assign({}, loginForm, {
            [name]: Object.assign({}, loginForm[name], {val: value, error: null})
          })
        });
      }
      return (
        <section className="content">
          <div className="container">
            <h1 className="main-title">
              Login required
            </h1>
            {userState === "fresh-token-required" && <p><strong>The actions you are about to take need to be authorized by your password.</strong></p>}
          </div>
          <form>
            {message && <p className={messageOk ? "message-success" : "message-error"}>{message}</p>}
            <FormInputs definition={loginForm} updateValue={updateValue} />
            <div className="form-actions">
              <button type="submit" onClick={this.login} disabled={submitting}>Login</button>
              {userState === "fresh-token-required" && <button className={submitting ? "hidden" : ""} type="reset" onClick={() => {
                setCurrentUserState("logged-in");
                history.push('/');
              }} disabled={submitting}>Cancel</button>}
            </div>
          </form>
         </section>
      );
    } else {
      return <React.Fragment>{children}</React.Fragment>;
    }
  }
}

export default withRouter(connect(
  state => ({
    userState: state.users.me.currentState,
    username: state.users.me.username,
  }),
  dispatch => ({
    doAuthenticate: (username, password) => dispatch(authenticate(username, password)),
    setCurrentUserState: (userState) => dispatch(setCurrentState(userState)),
  })
)(LoginGateway));
