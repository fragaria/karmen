import React from "react";
import { connect } from "react-redux";
import { Link, Redirect, withRouter } from "react-router-dom";
import { FormInputs } from "../../components/forms/form-utils";
import BusyButton from "../../components/utils/busy-button";
import Loader from "../../components/utils/loader";
import { activate } from "../../actions";
import jwt_decode from "jwt-decode";


class RegisterConfirmation extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tokenProcessed: false,
      email: undefined,
      activationKey: undefined,
      activationKeyExpires: undefined,
      message: null,
      messageOk: false,
      passwordForm: {
        email: {
          type: "honeypot",
          val: "",
        },
        password: {
          name: "New password",
          val: "",
          type: "password",
          required: true,
          autocomplete: "new-password",
        },
        passwordConfirmation: {
          name: "New password confirmation",
          val: "",
          type: "password",
          required: true,
          autocomplete: "new-password",
        },
      },
    };
    this.activate = this.activate.bind(this);
  }

  componentDidMount() {
    const { location } = this.props;
    const params = new URLSearchParams(location.search);
    if (params.has("activate")) {
      try {
        const tokenData = jwt_decode(params.get("activate"));
        this.setState({
          email: tokenData.sub,
          activationKey: params.get("activate"),
          activationKeyExpires: tokenData.lifetime,
          tokenProcessed: true,
        });
      } catch (e) {
        console.error(e);
        // silent pass as if no token was encountered
      }
    }
    this.setState({
      tokenProcessed: true,
    });
  }

  activate(e) {
    e.preventDefault();
    const { passwordForm, email, activationKey } = this.state;
    const { doActivate } = this.props;
    if (passwordForm.email.val) {
      throw new Error("seems like spam");
    }
    let hasError = false;
    // eslint-disable-next-line no-unused-vars
    for (let field of Object.values(passwordForm)) {
      if (field.required && !field.val) {
        field.error = `${field.name} is required!`;
        hasError = true;
      } else {
        field.error = "";
      }
    }
    if (passwordForm.password.val) {
      if (passwordForm.password.val !== passwordForm.passwordConfirmation.val) {
        passwordForm.password.error = "Passwords do not match!";
        hasError = true;
      } else {
        passwordForm.password.error = "";
      }
    }

    if (hasError) {
      this.setState({
        passwordForm: Object.assign({}, passwordForm),
      });
      return;
    }

    return doActivate(
      email,
      activationKey,
      passwordForm.password.val,
      passwordForm.passwordConfirmation.val
    )
      .then(() => {
        this.setState({
          message:
            "Your account has been activated, please login with the new password",
          messageOk: true,
          passwordForm: Object.assign({}, passwordForm, {
            email: Object.assign({}, passwordForm.email, { val: "" }),
          }),
        });
      })
      .catch((err) => {
        this.setState({
          messageOk: false,
          message: (
            <>
              Account activation failed. Please, try{" "}
              <Link to="/register" className="anchor">
                registering again
              </Link>{" "}
              .
            </>
          ),
        });
      });
  }

  render() {
    const {
      passwordForm,
      message,
      messageOk,
      tokenProcessed,
      email,
      activationKey,
      activationKeyExpires,
    } = this.state;
    const updateValue = (name, value, target) => {
      const { passwordForm } = this.state;
      this.setState({
        passwordForm: Object.assign({}, passwordForm, {
          [name]: Object.assign({}, passwordForm[name], {
            val: value,
            error: null,
          }),
        }),
      });
    };

    if (!tokenProcessed) {
      return <Loader />;
    }

    if (tokenProcessed && new Date(activationKeyExpires * 1000) < new Date()) {
      // TODO this is not really user friendly
      return <Redirect to="/page-404" />;
    }

    if (tokenProcessed && (!email || !activationKey)) {
      // TODO this is not really user friendly
      return <Redirect to="/login" />;
    }

    return (
      <div className="content">
        <div className="container">
          <h1 className="main-title text-center">
            Welcome to Karmen, <br />
            {email}!
          </h1>
          <h2 className="main-subtitle text-center">
            To start using Karmen You need to set the password.
          </h2>
          <form>
            {!!!messageOk && (
              <FormInputs definition={passwordForm} updateValue={updateValue} />
            )}

            <div className="form-messages">
              {message && (
                <p
                  className={
                    messageOk
                      ? "text-success text-center"
                      : "message-error text-center"
                  }
                >
                  {message}
                </p>
              )}
            </div>

            <div className="cta-box text-center">
              {!!!messageOk && (
                <>
                  <BusyButton
                    className="btn"
                    type="submit"
                    onClick={this.activate}
                    busyChildren="Setting password..."
                  >
                    Set password
                  </BusyButton>{" "}
                  <Link to="/login" className="btn btn-plain">
                    Cancel
                  </Link>
                </>
              )}
              {message && messageOk && (
                <Link to="/login" className="btn">
                  Log in to Karmen
                </Link>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }
}

export default withRouter(
  connect(undefined, (dispatch) => ({
    doActivate: (email, activationKey, password, passwordConfirmation) =>
      dispatch(activate(email, activationKey, password, passwordConfirmation)),
  }))(RegisterConfirmation)
);
