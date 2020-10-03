import React from "react";
import { Link } from "react-router-dom";

import { HttpError } from "../../errors";
import BusyButton from "../utils/busy-button";
import { FormInputs } from "./form-utils";

class LoginForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: null,
      messageOk: false,
      loginForm: {
        email: {
          type: "honeypot",
          val: "",
        },
        username: {
          name: "Username",
          val: "",
          type: "text",
          required: true,
          autocomplete: "username",
        },
        password: {
          name: "Password",
          val: "",
          type: "password",
          required: true,
          autocomplete: "current-password",
        },
      },
    };
    this.login = this.login.bind(this);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.username) {
      return {
        loginForm: Object.assign({}, prevState.loginForm, {
          username: Object.assign({}, prevState.loginForm.username, {
            val: nextProps.username,
          }),
        }),
      };
    }
    return null;
  }

  componentDidMount() {
    this._ismounted = true;
  }

  componentWillUnmount() {
    this._ismounted = false;
  }

  login(e) {
    e.preventDefault();
    const { loginForm } = this.state;
    if (loginForm.email.val) {
      throw new Error("seems like spam");
    }
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
        loginForm: Object.assign({}, loginForm),
      });
      return;
    }

    return doAuthenticate(loginForm.username.val, loginForm.password.val)
      .then(() => {
        if (this._ismounted) {
          this.setState({
            message: "",
            messageOk: true,
            loginForm: Object.assign({}, loginForm, {
              password: Object.assign({}, loginForm.password, { val: "" }),
              username: Object.assign({}, loginForm.username, { val: "" }),
            }),
          });
        }
      })
      .catch((err) => {
        if (err instanceof HttpError && err.response.status === 401) {
          return this.setState({
            messageOk: false,
            message: "Invalid email or password, try again, please.",
            loginForm: Object.assign({}, loginForm, {
              password: Object.assign({}, loginForm.password, { val: "" }),
            }),
          });
        }

        this.setState({
          messageOk: false,
          message: "Internal server problem, try again, please.",
          loginForm: Object.assign({}, loginForm, {
            password: Object.assign({}, loginForm.password, { val: "" }),
          }),
        });
      });
  }

  render() {
    const { message, messageOk, loginForm } = this.state;
    const { loginInformation, onCancel } = this.props;

    const updateValue = (name, value, target) => {
      const { loginForm } = this.state;
      this.setState({
        loginForm: Object.assign({}, loginForm, {
          [name]: Object.assign({}, loginForm[name], {
            val: value,
            error: null,
          }),
        }),
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
                Log in
              </BusyButton>{" "}
              {!onCancel && (
                <>
                  <Link to="/register" className="btn btn-plain">
                    Register
                  </Link>
                  <br />
                  <br />
                  <Link to="/request-password-reset" className="anchor">
                    Forgotten password
                  </Link>
                </>
              )}
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
