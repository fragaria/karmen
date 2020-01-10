import React from "react";
import { Redirect } from "react-router-dom";
import { connect } from "react-redux";
import { BackLink } from "../components/back";
import { FormInputs } from "../components/form-utils";
import { addUser } from "../actions/users";
import RoleBasedGateway from "../components/role-based-gateway";
import FreshUserRequiredCheck from "../components/fresh-token-required-check";

class AddUser extends React.Component {
  state = {
    redirect: false,
    submitting: false,
    message: null,
    messageOk: false,
    form: {
      username: {
        name: "Username",
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
      },
      password: {
        name: "New password",
        val: "",
        type: "password",
        required: true
      },
      password_confirmation: {
        name: "New password confirmation",
        val: "",
        type: "password",
        required: true
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
      messageOk: false,
      submitting: true
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
    if (form.password.val) {
      if (form.password.val !== form.password_confirmation.val) {
        form.password.error = "New passwords do not match!";
        hasErrors = true;
      } else {
        form.password.error = "";
      }
    }
    if (hasErrors) {
      this.setState({
        form: Object.assign({}, form),
        submitting: false
      });
      return;
    }
    const { createUser } = this.props;
    if (!hasErrors) {
      createUser(
        form.username.val,
        form.role.val,
        form.password.val,
        form.password_confirmation.val
      ).then(r => {
        console.log(r);
        switch (r.status) {
          case 201:
            this.setState({
              submitting: false,
              redirect: true
            });
            break;
          case 409:
            this.setState({
              message: "User with such username is already registered",
              submitting: false
            });
            break;
          default:
            this.setState({
              message: "Cannot add user, check server logs",
              submitting: false
            });
        }
      });
    } else {
      this.setState({
        submitting: false
      });
    }
  }

  render() {
    const { form, message, messageOk, redirect, submitting } = this.state;
    const { hasFreshUser } = this.props;
    if (!hasFreshUser) {
      return (
        <RoleBasedGateway requiredRole="admin">
          <FreshUserRequiredCheck />
        </RoleBasedGateway>
      );
    }
    if (redirect) {
      return <Redirect to="/users" />;
    }
    return (
      <RoleBasedGateway requiredRole="admin">
        <div className="content printer-list">
          <div className="container">
            <h1 className="main-title text-center">Add a new user</h1>
            <p className="text-center">
              The password is for the first login only and will have to be changed
              afterwards.
            </p>
            <form>
              {message && (
                <p className={messageOk ? "message-success" : "message-error"}>
                  {message}
                </p>
              )}
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
              <div className="cta-box text-center">
                <button
                  className="btn"
                  type="submit"
                  onClick={this.addUser}
                  disabled={submitting}
                >
                  Add user
                </button>{" "}
                <BackLink to="/" />
              </div>
            </form>
          </div>
        </div>
      </RoleBasedGateway>
    );
  }
}

export default connect(
  state => ({
    hasFreshUser: state.users.me.hasFreshToken
  }),
  dispatch => ({
    createUser: (username, role, password, passwordConfirmation) =>
      dispatch(addUser(username, role, password, passwordConfirmation))
  })
)(AddUser);
