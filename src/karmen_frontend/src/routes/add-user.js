import React from "react";
import { Redirect, Link } from "react-router-dom";
import { connect } from "react-redux";
import { addUser } from "../actions/users";
import { FormInputs } from "../components/forms/form-utils";
import OrgRoleBasedGateway from "../components/gateways/org-role-based-gateway";
import FreshTokenGateway from "../components/gateways/fresh-token-gateway";
import BusyButton from "../components/utils/busy-button";
import { isEmail } from "../services/validators";

class AddUser extends React.Component {
  state = {
    redirect: false,
    message: null,
    messageOk: false,
    form: {
      email: {
        name: "E-mail",
        val: "",
        type: "text",
        required: true,
        error: null
      },
      role: {
        name: "Role",
        val: "user",
        type: "select",
        required: true,
        options: [
          { val: "user", name: "User" },
          { val: "admin", name: "Admin" }
        ]
      }
    }
  };

  constructor(props) {
    super(props);
    this.addUser = this.addUser.bind(this);
  }

  addUser(e) {
    e.preventDefault();
    this.setState({
      message: null,
      messageOk: false
    });
    const { form } = this.state;
    let hasErrors = false;
    // eslint-disable-next-line no-unused-vars
    for (let field of Object.values(form)) {
      if (field.required && !field.val) {
        field.error = `${field.name} is required!`;
        hasErrors = true;
      } else {
        field.error = "";
      }
    }
    if (!isEmail(form.email.val)) {
      hasErrors = true;
      form.email.error = "That does not seem like an e-mail address";
    }

    if (hasErrors) {
      this.setState({
        form: Object.assign({}, form)
      });
      return;
    }
    const { createUser } = this.props;
    if (!hasErrors) {
      return createUser(form.email.val, form.role.val).then(r => {
        switch (r.status) {
          case 201:
            this.setState({
              redirect: true
            });
            break;
          case 409:
            this.setState({
              message: "User with such email is already registered"
            });
            break;
          default:
            this.setState({
              message: "Cannot add user, check server logs"
            });
        }
      });
    }
  }

  render() {
    const { form, message, messageOk, redirect } = this.state;
    if (redirect) {
      return <Redirect to="/settings" />;
    }
    return (
      <OrgRoleBasedGateway requiredRole="admin">
        <FreshTokenGateway>
          <div className="content">
            <div className="container">
              <h1 className="main-title text-center">Add a new user</h1>
              <form>
                <FormInputs
                  definition={form}
                  updateValue={(name, value) => {
                    this.setState({
                      form: Object.assign({}, form, {
                        [name]: Object.assign({}, form[name], {
                          val: value,
                          error: null
                        })
                      })
                    });
                  }}
                />

                <div className="form-messages">
                  {message && (
                    <p
                      className={
                        messageOk ? "message-success" : "message-error"
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
                    onClick={this.addUser}
                    busyChildren="Adding..."
                  >
                    Add user
                  </BusyButton>{" "}
                  <Link to="/settings" className="btn btn-plain">
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </FreshTokenGateway>
      </OrgRoleBasedGateway>
    );
  }
}

export default connect(null, dispatch => ({
  createUser: (email, role) => dispatch(addUser(email, role))
}))(AddUser);
