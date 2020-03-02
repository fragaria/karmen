import React from "react";
import { Redirect, Link } from "react-router-dom";
import { connect } from "react-redux";
import FreshTokenGateway from "../../components/gateways/fresh-token-gateway";
import { FormInputs } from "../../components/forms/form-utils";
import { addUserApiToken } from "../../actions/users-me";
import BusyButton from "../../components/utils/busy-button";

class AddApiToken extends React.Component {
  constructor(props) {
    super(props);
    const { activeOrganization, organizations } = this.props;
    this.state = {
      showToken: false,
      createdToken: null,
      redirect: false,
      message: null,
      messageOk: false,
      form: {
        name: {
          name: "Token's name",
          val: "",
          type: "text",
          required: true,
          error: null
        },
        orguuid: {
          name: "Organization",
          val: activeOrganization.uuid,
          type: "select",
          required: true,
          options: Object.values(organizations).map(o => ({
            val: o.uuid,
            name: o.name
          }))
        }
      }
    };

    this.addApiToken = this.addApiToken.bind(this);
  }

  addApiToken(e) {
    e.preventDefault();
    this.setState({
      message: null,
      messageOk: false,
      showToken: false,
      createdToken: null
    });
    const { form } = this.state;
    let hasErrors = false;
    let updatedForm = Object.assign({}, form);
    if (!form.name.val) {
      hasErrors = true;
      updatedForm.name.error = "Name is required";
    }
    this.setState({
      form: updatedForm
    });
    const { addApiToken } = this.props;
    if (!hasErrors) {
      return addApiToken(form.orguuid.val, form.name.val).then(r => {
        switch (r.status) {
          case 201:
            this.setState({
              showToken: true,
              createdToken: r.data.access_token
            });
            break;
          default:
            this.setState({
              message: "Cannot add API token, check server logs"
            });
        }
      });
    }
  }

  render() {
    const {
      message,
      messageOk,
      redirect,
      form,
      showToken,
      createdToken
    } = this.state;
    if (redirect) {
      return <Redirect to="/users/me" />;
    }

    return (
      <FreshTokenGateway>
        <div className="content">
          <div className="container">
            <h1 className="main-title text-center">Create new API token</h1>
            {showToken ? (
              <>
                <div className="content-section">
                  <ul className="ul-styled">
                    <li>
                      This is the token that is required to talk to Karmen API
                    </li>
                    <li>
                      It has to be used with every API request in the
                      Authorization header like this{" "}
                      <code>Authorization: Bearer &lt;token&gt;</code>
                    </li>
                    <li>
                      This token also does not have an expiration date and can
                      be used forever
                    </li>
                    <li>
                      If you need to disable it, you have to revoke it on the
                      User preferences screen
                    </li>
                    <li>
                      This token is not authorized to modify your password and
                      cannot be used for administrative tasks like user
                      management
                    </li>
                    <li>
                      <strong>
                        You will never see this token again, so be sure that you
                        have a secure copy of it
                      </strong>
                    </li>
                  </ul>
                  <pre>{createdToken}</pre>
                </div>
                <div className="cta-box text-center">
                  <button
                    className="btn"
                    type="submit"
                    onClick={e => {
                      e.preventDefault();
                      this.setState({
                        showToken: false,
                        createdToken: null,
                        redirect: true
                      });
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </>
            ) : (
              <form>
                {message && (
                  <p
                    className={messageOk ? "message-success" : "message-error"}
                  >
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
                  <BusyButton
                    className="btn"
                    type="submit"
                    onClick={this.addApiToken}
                    busyChildren="Creating..."
                  >
                    Create token
                  </BusyButton>{" "}
                  <Link to="/users/me/api-tokens" className="btn btn-plain">
                    Cancel
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </FreshTokenGateway>
    );
  }
}

export default connect(
  state => ({
    activeOrganization: state.users.me.activeOrganization,
    organizations: state.users.me.organizations
  }),
  dispatch => ({
    addApiToken: (orguuid, name) => dispatch(addUserApiToken(orguuid, name))
  })
)(AddApiToken);
