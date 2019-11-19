import React from 'react';
import { connect } from 'react-redux';
import { authenticate, changePassword } from '../actions/users';
import { FormInputs } from '../components/form-utils';
import Loader from '../components/loader';

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
          val: '',
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
      changePwdForm: {
        password: {
          name: "Password",
          val: '',
          type: 'password',
          required: true,
        },
        new_password: {
          name: "New password",
          val: '',
          type: 'password',
          required: true,
        },
        new_password_confirmation: {
          name: "New password confirmation",
          val: '',
          type: 'password',
          required: true,
        },
      }
    }
    this.login = this.login.bind(this);
    this.changePwd = this.changePwd.bind(this);
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
            });
          });
        }
      });
  }

  changePwd(e) {
    e.preventDefault();
    const { changePwdForm } = this.state;
    const { onUserStateChanged, doChangePassword } = this.props;
    let hasError = false;
    // eslint-disable-next-line no-unused-vars
    for(let field of Object.values(changePwdForm)) {
      if (field.required && !field.val) {
        field.error = `${field.name} is required!`;
        hasError = true;
      } else {
        field.error = "";
      }
    }
    if (changePwdForm.new_password.val) {
      if (changePwdForm.new_password.val !== changePwdForm.new_password_confirmation.val) {
        changePwdForm.new_password.error = "New passwords do not match!";
        hasError = true;
      } else {
        changePwdForm.new_password.error = "";
      }
    }
    if (hasError) {
      this.setState({
        changePwdForm: Object.assign({}, changePwdForm),
      })
      return;
    }
    this.setState({
      submitting: true,
    });
    doChangePassword(changePwdForm.password.val, changePwdForm.new_password.val, changePwdForm.new_password_confirmation.val)
      .then(async (code) => {
        if (code !== 200) {
          this.setState({
            messageOk: false,
            message: "Password change unsuccessful, try again, please.",
            submitting: false,
            changePwdForm: Object.assign({}, changePwdForm, {
              password: Object.assign({}, changePwdForm.password, { val: '' }),
              new_password: Object.assign({}, changePwdForm.new_password, { val: '' }),
              new_password_confirmation: Object.assign({}, changePwdForm.new_password_confirmation, { val: '' }),
            })
          });
        } else {
          onUserStateChanged().then(() => {
            this.setState({
              submitting: false,
            });
          });
        }
      });
  }

  render() {
    const { children } = this.props;
    const { message, messageOk, submitting, loginForm, changePwdForm } = this.state;
    const { userState } = this.props;
    if (!userState || userState === 'unknown') {
      return <div><Loader /></div>;
    }
    if (userState === 'logged-in') {
      return <React.Fragment>{children}</React.Fragment>;
    } else if (userState === 'pwd-change-required') {
      const updateValue = (name, value) => {
        const { changePwdForm } = this.state;
        this.setState({
          changePwdForm: Object.assign({}, changePwdForm, {
            [name]: Object.assign({}, changePwdForm[name], {val: value, error: null})
          })
        });
      }
      return (
        <div className="standalone-page">
          <header>
            <h1 className="title">Your password needs to be changed</h1>
          </header>
          <form>
            {message && <p className={messageOk ? "message-success" : "message-error"}>{message}</p>}
            <FormInputs definition={changePwdForm} updateValue={updateValue} />
            <div className="form-actions">
              <button type="submit" onClick={this.changePwd} disabled={submitting}>Change password</button>
            </div>
          </form>
        </div>
      );
    } else {
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
    }
  }
}

export default connect(
  state => ({
    userState: state.users.currentState,
  }),
  dispatch => ({
    doAuthenticate: (username, password) => dispatch(authenticate(username, password)),
    doChangePassword: (password, new_password, new_password_confirmation) => dispatch(changePassword(password, new_password, new_password_confirmation))
  })
)(LoginGateway);
