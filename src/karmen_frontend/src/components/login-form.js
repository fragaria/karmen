import React from "react";
import { FormInputs } from "./form-utils";
import BusyButton from "./busy-button";

class LoginForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: null,
      messageOk: false,
      loginForm: {
        username: {
          name: "Username",
          val: "",
          type: "text",
          required: true
        },
        password: {
          name: "Password",
          val: "",
          type: "password",
          required: true
        }
      }
    };
    this.login = this.login.bind(this);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.username) {
      return {
        loginForm: Object.assign({}, prevState.loginForm, {
          username: Object.assign({}, prevState.loginForm.username, {
            val: nextProps.username
          })
        })
      };
    }
    return null;
  }

  login(e) {
    e.preventDefault();
    const { loginForm } = this.state;
    const { doAuthenticate } = this.props;
    let hasError = false;
    // eslint-disable-next-line no-unused-vars
    for (let field of Object.values(loginForm)) {
      if (field.required && !field.val) {
        field.error = `${field.name} is required!`;
        hasError = true;
      } else {
        field.error = "";
      }
    }
    if (hasError) {
      this.setState({
        loginForm: Object.assign({}, loginForm)
      });
      return;
    }
    return doAuthenticate(loginForm.username.val, loginForm.password.val).then(
      r => {
        if (r.status !== 200) {
          this.setState({
            messageOk: false,
            message:
              (r.data && r.data.message) ||
              "Login unsuccessful, try again, please.",
            loginForm: Object.assign({}, loginForm, {
              password: Object.assign({}, loginForm.password, { val: "" })
            })
          });
        } else {
          this.setState({
            message: "",
            messageOk: true,
            loginForm: Object.assign({}, loginForm, {
              password: Object.assign({}, loginForm.password, { val: "" }),
              username: Object.assign({}, loginForm.username, { val: "" })
            })
          });
        }
      }
    );
  }

  render() {
    const { message, messageOk, loginForm } = this.state;
    const { loginInformation, onCancel } = this.props;

    const updateValue = (name, value) => {
      const { loginForm } = this.state;
      this.setState({
        loginForm: Object.assign({}, loginForm, {
          [name]: Object.assign({}, loginForm[name], {
            val: value,
            error: null
          })
        })
      });
    };
    return (
      <section className="content">
        <div className="container">
          <h1 className="main-title text-center">Login required</h1>
          {loginInformation}
          <form>
            {message && (
              <p
                className={
                  messageOk
                    ? "text-success text-center"
                    : "text-secondary text-center"
                }
              >
                {message}
              </p>
            )}
            <FormInputs definition={loginForm} updateValue={updateValue} />
            <div className="cta-box text-center">
              <BusyButton
                className="btn"
                type="submit"
                onClick={this.login}
                busyChildren="Logging in..."
              >
                Login
              </BusyButton>{" "}
              {onCancel && (
                <BusyButton
                  className="btn btn-plain"
                  type="reset"
                  onClick={onCancel}
                >
                  Cancel
                </BusyButton>
              )}
            </div>
          </form>
        </div>
      </section>
    );
  }
}

export default LoginForm;
