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
          name: "Your e-mail",
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
      registerForm.realemail.error =
        "That does not seem like an e-mail address";
    }

    if (hasError) {
      this.setState({
        registerForm: Object.assign({}, registerForm),
      });
      return;
    }

    return doRegister(registerForm.realemail.val).then((r) => {
      if (r.status !== 202) {
        this.setState({
          messageOk: false,
          message:
            "We cannot send you the e-mail at this moment, try again later, please.",
        });
      } else {
        this.setState({
          message: "An e-mail will be sent shortly. Check your Inbox, please",
          messageOk: true,
          registerForm: Object.assign({}, registerForm, {
            realemail: Object.assign({}, registerForm.realemail, { val: "" }),
          }),
        });
      }
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
            We will send You an e-mail with verification link.
          </h2>
          <form>
            <FormInputs definition={registerForm} updateValue={updateValue} />

            <div className="form-messages">
              {message && (
                <p
                  className={
                    messageOk
                      ? "message-success text-center"
                      : "message-error text-center"
                  }
                >
                  {message}
                </p>
              )}
            </div>

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
          </form>
        </div>
      </div>
    );
  }
}

export default connect(undefined, (dispatch) => ({
  doRegister: (email) => dispatch(register(email)),
}))(Register);
