import React from "react";
import { Redirect, Link } from "react-router-dom";
import { connect } from "react-redux";
import { addUser } from "../../actions";
import { FormInputs } from "../../components/forms/form-utils";
import SetActiveOrganization from "../../components/gateways/set-active-organization";
import OrgRoleBasedGateway from "../../components/gateways/org-role-based-gateway";
import FreshTokenGateway from "../../components/gateways/fresh-token-gateway";
import BusyButton from "../../components/utils/busy-button";
import { HttpError } from "../../errors";
import { isEmail } from "../../services/validators";

class AddUser extends React.Component {
  state = {
    redirect: false,
    message: null,
    messageOk: false,
    form: {
      email: {
        name: "Email",
        val: "",
        type: "text",
        required: true,
        error: null,
      },
      role: {
        name: "Role",
        val: "user",
        type: "select",
        required: true,
        options: [
          { val: "user", name: "User" },
          { val: "admin", name: "Admin" },
        ],
      },
    },
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
      form.email.error = "That does not seem like an email address";
    }

    if (hasErrors) {
      this.setState({
        form: Object.assign({}, form),
      });
      return;
    }
    const { createUser } = this.props;
    if (!hasErrors) {
      return createUser(form.email.val, form.role.val)
        .then((r) => {
          console.log(r);
          if (r.status === 201) {
            this.setState({
              redirect: true,
            });
          } else {
            form.email.error = r.data.detail
              ? r.data.detail // We either got denied by connexion, with reason in detail
              : r.data.message
              ? r.data.message // Or by backend in message
              : "Unexpected error while parsing email";
            this.setState({
              form: Object.assign({}, form),
            });
          }
        })
        .catch((err) => {
          if (err instanceof HttpError && err.response.status === 409) {
            return this.setState({
              message: "User with such email is already registered",
            });
          }
          this.setState({
            message:
              "Could not add new user, there has been some problem on the server.",
          });
        });
    }
  }

  render() {
    const { form, message, messageOk, redirect } = this.state;
    const { match } = this.props;
    if (redirect) {
      return <Redirect to={`/${match.params.orguuid}/settings/tab-users`} />;
    }
    return (
      <>
        <SetActiveOrganization />
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
                            error: null,
                          }),
                        }),
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
                    <Link
                      to={`/${match.params.orguuid}/settings/tab-users`}
                      className="btn btn-plain"
                    >
                      Cancel
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </FreshTokenGateway>
        </OrgRoleBasedGateway>
      </>
    );
  }
}

export default connect(null, (dispatch, ownProps) => ({
  createUser: (email, role) =>
    dispatch(addUser(ownProps.match.params.orguuid, email, role)),
}))(AddUser);
