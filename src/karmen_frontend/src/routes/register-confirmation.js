import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { FormInputs } from "../components/forms/form-utils";
import BusyButton from "../components/utils/busy-button";
import { register } from "../actions/users-me";
import { isEmail } from "../services/validators";

class RegisterConfirmation extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: null,
      messageOk: false,
      passwordForm: {
        new_password: {
          name: "New password",
          val: "",
          type: "password",
          required: true
        },
        new_password_confirmation: {
          name: "New password confirmation",
          val: "",
          type: "password",
          required: true
        }
      }
    };
    this.register = this.register.bind(this);
  }

  register(e) {
    e.preventDefault();
    const { passwordForm } = this.state;
    const { doRegister } = this.props;
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

    if (hasError) {
      this.setState({
        passwordForm: Object.assign({}, passwordForm)
      });
      return;
    }
  }

  render() {
    const { passwordForm, message, messageOk } = this.state;
    const updateValue = (name, value) => {
      const { passwordForm } = this.state;
      this.setState({
        passwordForm: Object.assign({}, passwordForm, {
          [name]: Object.assign({}, passwordForm[name], {
            val: value,
            error: null
          })
        })
      });
    };

    return (
      <div className="content">
        <div className="container">
          <h1 className="main-title text-center">Welcome to Karmen, user.name@mail!</h1>
          <form>
            <FormInputs definition={passwordForm} updateValue={updateValue} />

            <div className="form-messages">
              <p className="text-center">
                To start using Karmen You need to set the password.
              </p>

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

export default connect(undefined, dispatch => ({
  doRegister: email => dispatch(register(email))
}))(RegisterConfirmation);
