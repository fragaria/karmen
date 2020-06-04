import React from "react";
import { Redirect, Link } from "react-router-dom";
import { connect } from "react-redux";
import { addOrganization } from "../actions";
import { FormInputs } from "../components/forms/form-utils";
import FreshTokenGateway from "../components/gateways/fresh-token-gateway";
import BusyButton from "../components/utils/busy-button";
import { HttpError } from "../errors";
import { switchOrganization } from "../actions";

class AddOrganization extends React.Component {
  state = {
    redirect: false,
    message: null,
    messageOk: false,
    form: {
      name: {
        name: "Name",
        val: "",
        type: "text",
        required: true,
        error: null,
      },
    },
  };

  constructor(props) {
    super(props);
    this.addOrganization = this.addOrganization.bind(this);
  }

  addOrganization(e) {
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
    if (hasErrors) {
      this.setState({
        form: Object.assign({}, form),
      });
      return;
    }
    const { createOrganization } = this.props;
    if (!hasErrors) {
      return createOrganization(form.name.val)
        .then(() => {
          this.setState({
            redirect: true,
          });
        })
        .catch((err) => {
          if (err instanceof HttpError && err.response.status === 409) {
            return this.setState({
              message: "Organization with such name is already registered",
            });
          }

          this.setState({
            message:
              "Could not add new organization, there has been some problem on the server.",
          });
        });
    }
  }

  render() {
    const {
      form,
      message,
      messageOk,
      redirect,
      activeOrganization,
    } = this.state;
    if (redirect && !activeOrganization) {
      //if user had no organizations and just created the first one, send him home
      return <Redirect to="/" />;
    }
    if (redirect) {
      return <Redirect to="/organizations" />;
    }
    return (
      <FreshTokenGateway>
        <div className="content">
          <div className="container">
            <h1 className="main-title text-center">Add a new organization</h1>
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
                    className={messageOk ? "message-success" : "message-error"}
                  >
                    {message}
                  </p>
                )}
              </div>

              <div className="cta-box text-center">
                <BusyButton
                  className="btn"
                  type="submit"
                  onClick={this.addOrganization}
                  busyChildren="Adding..."
                >
                  Add organization
                </BusyButton>{" "}
                <Link to="/organizations" className="btn btn-plain">
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </FreshTokenGateway>
    );
  }
}

export default connect(
  (state) => ({
    activeOrganization: state.me.activeOrganization,
  }),
  (dispatch) => ({
    createOrganization: (name) => dispatch(addOrganization(name)),
    switchOrganization: (uuid) => dispatch(switchOrganization(uuid)),
  })
)(AddOrganization);
