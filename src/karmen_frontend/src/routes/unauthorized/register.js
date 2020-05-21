import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { FormInputs } from "../../components/forms/form-utils";
import BusyButton from "../../components/utils/busy-button";
import { isEmail } from "../../services/validators";
import { register } from "../../actions";

class Register extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: null,
      messageOk: false,
      registerForm: {
        email: {
          type: "honeypot",
          val: "",
        },
        realemail: {
          name: "Your email",
          val: "",
          type: "text",
          required: true,
          autocomplete: "email",
        },
      },
    };
    this.register = this.register.bind(this);
  }

  register(e) {
    e.preventDefault();
    const { registerForm } = this.state;
    if (registerForm.email.val) {
      throw new Error("seems like spam");
    }
    const { doRegister } = this.props;
    let hasError = false;
    // eslint-disable-next-line no-unused-vars
    for (let field of Object.values(registerForm)) {
      if (field.required && !field.val) {
        field.error = `${field.name} is required!`;
        hasError = true;
      } else {
        field.error = "";
      }
    }
    if (!isEmail(registerForm.realemail.val)) {
      hasError = true;
      registerForm.realemail.error = "That does not seem like an email address";
    }

    if (hasError) {
      this.setState({
        registerForm: Object.assign({}, registerForm),
      });
      return;
    }

    return doRegister(registerForm.realemail.val)
      .then((r) => {
        this.setState({
          message: `<p>We've sent you an email to <strong>${registerForm.realemail.val}</strong><br/> with the instructions on how to proceed next.</p> <p>Thank you for signing up, <br/>you can now close this window.</p>`,
          messageOk: true,
          registerForm: Object.assign({}, registerForm, {
            realemail: Object.assign({}, registerForm.realemail, { val: "" }),
          }),
        });
      })
      .catch((err) => {
        this.setState({
          messageOk: false,
          message:
            "Although we're doing our best, it seems we can't send you the email at the moment. Please, try again later.",
        });
      });
  }

  render() {
    const { registerForm, message, messageOk } = this.state;
    const updateValue = (name, value) => {
      const { registerForm } = this.state;
      this.setState({
        registerForm: Object.assign({}, registerForm, {
          [name]: Object.assign({}, registerForm[name], {
            val: value,
            error: null,
          }),
        }),
      });
    };

    return (
      <div className="content">
        <div className="container">
          <h1 className="main-title text-center">Karmen registration</h1>
          <h2 className="main-subtitle text-center">
            We will send You an email with a verification link.
          </h2>
          <form>
            {!messageOk && (
              <FormInputs definition={registerForm} updateValue={updateValue} />
            )}

            <div className="form-messages">
              {message && (
                <div
                  className={
                    messageOk ? "text-center" : "message-error text-center"
                  }
                  dangerouslySetInnerHTML={{ __html: message }}
                ></div>
              )}
            </div>

            {!messageOk && (
              <div className="cta-box text-center">
                <BusyButton
                  className="btn"
                  type="submit"
                  onClick={this.register}
                  busyChildren="Sending link..."
                >
                  Register
                </BusyButton>{" "}
                <Link to="/login" className="btn btn-plain">
                  Cancel
                </Link>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }
}

export default connect(undefined, (dispatch) => ({
  doRegister: (email) => dispatch(register(email)),
}))(Register);
