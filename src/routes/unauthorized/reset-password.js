import React from "react";
import { connect } from "react-redux";
import { Link, Redirect, withRouter } from "react-router-dom";
import { FormInputs } from "../../components/forms/form-utils";
import BusyButton from "../../components/utils/busy-button";
import Loader from "../../components/utils/loader";
import { resetPassword } from "../../actions";
import jwt_decode from "jwt-decode";

class ResetPassword extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tokenProcessed: false,
      email: undefined,
      pwdResetKey: undefined,
      pwdResetKeyExpires: undefined,
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
    this.reset = this.reset.bind(this);
  }

  componentDidMount() {
    const { location } = this.props;
    const params = new URLSearchParams(location.search);
    if (params.has("reset")) {
      try {
        const tokenData = jwt_decode(params.get("reset"));
        this.setState({
          email: tokenData.email,
          pwdResetKey: params.get("reset"),
          pwdResetKeyExpires: tokenData.lifetime,
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

  reset(e) {
    e.preventDefault();
    const { passwordForm, email, pwdResetKey } = this.state;
    const { doReset } = this.props;
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
        passwordForm.password.error = "The two passwords do not match!";
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

    return doReset(
      email,
      pwdResetKey,
      passwordForm.password.val,
      passwordForm.passwordConfirmation.val
    )
      .then(() => {
        this.setState({
          message:
            "Your password has been changed succefully. Please log in again with the new password.",
          messageOk: true,
          passwordForm: Object.assign({}, passwordForm, {
            email: Object.assign({}, passwordForm.email, { val: "" }),
          }),
        });
      })
      .catch((err) => {
        this.setState({
          messageOk: false,
          message:
            "We couldn't reset your password for some reason. Please try again later.",
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
      pwdResetKey,
      pwdResetKeyExpires,
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

    if (tokenProcessed && new Date(pwdResetKeyExpires * 1000) < new Date()) {
      // TODO this is not really user friendly
      return <Redirect to="/page-404" />;
    }

    if (tokenProcessed && (!email || !pwdResetKey)) {
      // TODO this is not really user friendly
      return <Redirect to="/login" />;
    }

    return (
      <div className="content">
        <div className="container">
          <h1 className="main-title text-center">
            Reset password for {email}?
          </h1>
          <form>
            <FormInputs definition={passwordForm} updateValue={updateValue} />

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
              {!messageOk && (
                <>
                  <BusyButton
                    className="btn"
                    type="submit"
                    onClick={this.reset}
                    busyChildren="Resetting..."
                  >
                    Reset
                  </BusyButton>{" "}
                  <Link to="/login" className="btn btn-plain">
                    Cancel
                  </Link>
                </>
              )}

              {messageOk && (
                <Link to="/login" className="btn">
                  Log in
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
    doReset: (email, pwdResetKey, password, passwordConfirmation) =>
      dispatch(
        resetPassword(email, pwdResetKey, password, passwordConfirmation)
      ),
  }))(ResetPassword)
);
