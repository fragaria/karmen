import React from 'react';
import { connect } from 'react-redux';
import { authenticate } from '../actions/users';
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
          val: props.username,
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
      .then(async (code) => {
        if (code !== 200) {
          this.setState({
            messageOk: false,
            message: "Login unsuccessful, try again, please.",
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
    const { children, userState } = this.props;
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
        <div className="standalone-page">
          <header>
            <h1 className="title">Login required</h1>
          </header>
          <form>
            {message && <p className={messageOk ? "message-success" : "message-error"}>{message}</p>}
            <FormInputs definition={loginForm} updateValue={updateValue} />
            <div className="form-actions">
              <button type="submit" onClick={this.login} disabled={submitting}>Login</button>
            </div>
          </form>
         </div>
      );
    } else {
      return <React.Fragment>{children}</React.Fragment>;
    }
  }
}

export default connect(
  state => ({
    userState: state.users.currentState,
    username: state.users.username,
  }),
  dispatch => ({
    doAuthenticate: (username, password) => dispatch(authenticate(username, password)),
  })
)(LoginGateway);
