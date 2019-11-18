import React from 'react';
import { currentLoginState, authenticate, changePassword } from '../services/backend';
import { FormInputs } from '../components/form-utils';
import Loader from '../components/loader';

export class LoginGateway extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      userState: 'unknown',
      initialized: false,
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
  }

  async componentDidMount() {
    const userState = await currentLoginState();
    this.login = this.login.bind(this);
    this.changePwd = this.changePwd.bind(this);
    this.setState({
      userState,
      initialized: true,
    });
  }

  login(e) {
    e.preventDefault();
    const { loginForm } = this.state;
    this.setState({
      submitting: true,
    });
    authenticate(loginForm.username.val, loginForm.password.val)
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
          const userState = await currentLoginState();
          this.setState({
            userState,
            submitting: false,
          });
        }
      });
  }

  changePwd(e) {
    e.preventDefault();
    const { changePwdForm } = this.state;
    this.setState({
      submitting: true,
    });
    changePassword(changePwdForm.password.val, changePwdForm.new_password.val, changePwdForm.new_password_confirmation.val)
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
          const userState = await currentLoginState();
          this.setState({
            userState,
            submitting: false,
          });
        }
      });
  }

  render() {
    const { children } = this.props;
    const { initialized, userState, message, messageOk, submitting, loginForm, changePwdForm } = this.state;
    if (!initialized) {
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

export default LoginGateway;
