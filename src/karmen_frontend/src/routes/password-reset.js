import React from "react";

import { Link } from "react-router-dom";
import { FormInputs } from "../components/forms/form-utils";

class PasswordReset extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      registerForm: {
        email: {
          name: "Your e-mail",
          val: "",
          type: "text",
          required: true
        }
      }
    };
  }
  render() {
    const { registerForm } = this.state;

    return (
      <div className="content">
        <div className="container">
          <h1 className="main-title text-center">Reset Your password</h1>
          <p className="text-center">
            We will send You an e-mail with password reset link.
          </p>
          <form>
            <FormInputs definition={registerForm} />
            <div className="cta-box text-center">
              <button className="btn">Send reset link</button>{" "}
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

export default PasswordReset;
