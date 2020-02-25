import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { FormInputs } from "../components/forms/form-utils";
import BusyButton from "../components/utils/busy-button";
import { resetPassword } from "../actions/users-me";
import { isEmail } from "../services/validators";

class PasswordReset extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: null,
      messageOk: false,
      resetForm: {
        email: {
          name: "Your e-mail",
          val: "",
          type: "text",
          required: true
        }
      }
    };
    this.reset = this.reset.bind(this);
  }

  reset(e) {
    e.preventDefault();
    const { resetForm } = this.state;
    const { doReset } = this.props;
    let hasError = false;
    // eslint-disable-next-line no-unused-vars
    for (let field of Object.values(resetForm)) {
      if (field.required && !field.val) {
        field.error = `${field.name} is required!`;
        hasError = true;
      } else {
        field.error = "";
      }
    }
    if (!isEmail(resetForm.email.val)) {
      hasError = true;
      resetForm.email.error = "That does not seem like an e-mail address";
    }

    if (hasError) {
      this.setState({
        resetForm: Object.assign({}, resetForm)
      });
      return;
    }

    return doReset(resetForm.email.val).then(r => {
      if (r.status !== 200) {
        this.setState({
          messageOk: false,
          message:
            "We cannot send you the e-mail at this moment, try again later, please."
        });
      } else {
        this.setState({
          message: "An e-mail will be sent shortly. Check your Inbox, please",
          messageOk: true,
          resetForm: Object.assign({}, resetForm, {
            email: Object.assign({}, resetForm.email, { val: "" })
          })
        });
      }
    });
  }

  render() {
    const { resetForm, message, messageOk } = this.state;
    const updateValue = (name, value) => {
      const { resetForm } = this.state;
      this.setState({
        resetForm: Object.assign({}, resetForm, {
          [name]: Object.assign({}, resetForm[name], {
            val: value,
            error: null
          })
        })
      });
    };

    return (
      <div className="content">
        <div className="container">
          <h1 className="main-title text-center">Reset Your password</h1>
          <p className="text-center">
            We will send You an e-mail with password reset link.
          </p>
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
            <FormInputs definition={resetForm} updateValue={updateValue} />
            <div className="cta-box text-center">
              <BusyButton
                className="btn"
                type="submit"
                onClick={this.reset}
                busyChildren="Sending link..."
              >
                Send reset link
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

export default connect(undefined, dispatch => ({
  doReset: email => dispatch(resetPassword(email))
}))(PasswordReset);
