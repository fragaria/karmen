import React from "react";
import { connect } from "react-redux";
import { Link, Redirect } from "react-router-dom";
import { FormInputs } from "../components/forms/form-utils";

class Register extends React.Component {
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
    const { userState } = this.props;

    if (userState !== "logged-out") {
      return <Redirect to="/" />;
    }

    return (
      <div className="content">
        <div className="container">
          <h1 className="main-title text-center">Karmen registration</h1>
          <p className="text-center">
            We will send You an e-mail with verification link.
          </p>
          <form>
            <FormInputs definition={registerForm} />
            <div className="cta-box text-center">
              <button className="btn">Register</button>{" "}
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

export default connect(state => ({
  userState: state.users.me.currentState
}))(Register);
