import React from "react";
import { Redirect } from "react-router-dom";
import { connect } from "react-redux";
import { BackLink } from "../components/back";
import { FormInputs } from "../components/form-utils";
import { addUserApiToken } from "../actions/users";
import FreshTokenRequiredCheck from "../components/fresh-token-required-check";

class AddApiToken extends React.Component {
  state = {
    showToken: false,
    createdToken: null,
    redirect: false,
    submitting: false,
    message: null,
    messageOk: false,
    form: {
      name: {
        name: "Token's name",
        val: "",
        type: "text",
        required: true,
        error: null
      }
    }
  };

  constructor(props) {
    super(props);
    this.addApiToken = this.addApiToken.bind(this);
  }

  addApiToken(e) {
    e.preventDefault();
    this.setState({
      message: null,
      messageOk: false,
      submitting: true,
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
      addApiToken(form.name.val).then(r => {
        switch (r.status) {
          case 201:
            this.setState({
              submitting: false,
              showToken: true,
              createdToken: r.data.access_token
            });
            break;
          default:
            this.setState({
              message: "Cannot add API token, check server logs",
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
    const { hasFreshToken } = this.props;
    if (!hasFreshToken) {
      return <FreshTokenRequiredCheck />;
    }
    const {
      message,
      messageOk,
      redirect,
      submitting,
      form,
      showToken,
      createdToken
    } = this.state;
    if (redirect) {
      return <Redirect to="/users/me" />;
    }

    return (
      <div className="standalone-page">
        <header>
          <h1 className="title">Create new API token</h1>
        </header>
        {showToken ? (
          <>
            <div className="content-section">
              <ul>
                <li>
                  This is the token that is required to talk to Karmen API
                </li>
                <li>
                  It has to be used with every API request in the Authorization
                  header like this{" "}
                  <code>Authorization: Bearer &lt;token&gt;</code>
                </li>
                <li>
                  This token also does not have an expiration date and can be
                  used forever
                </li>
                <li>
                  If you need to disable it, you have to revoke it on the User
                  preferences screen
                </li>
                <li>
                  This token is not authorized to modify your password and
                  cannot be used for administrative tasks like user management
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
            <div className="content-section">
              <button
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
            <div className="form-actions">
              <button
                type="submit"
                onClick={this.addApiToken}
                disabled={submitting}
              >
                Create token
              </button>
              <BackLink to="/users/me" />
            </div>
          </form>
        )}
      </div>
    );
  }
}

export default connect(
  state => ({
    hasFreshToken: state.users.me.hasFreshToken
  }),
  dispatch => ({
    addApiToken: name => dispatch(addUserApiToken(name))
  })
)(AddApiToken);
