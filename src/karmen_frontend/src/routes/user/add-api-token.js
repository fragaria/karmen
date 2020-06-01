import React from "react";
import { Redirect, Link } from "react-router-dom";
import { connect } from "react-redux";
import { CopyToClipboard } from "react-copy-to-clipboard";

import FreshTokenGateway from "../../components/gateways/fresh-token-gateway";
import { FormInputs } from "../../components/forms/form-utils";
import BusyButton from "../../components/utils/busy-button";
import { addUserApiToken } from "../../actions";

class AddApiToken extends React.Component {
  constructor(props) {
    super(props);
    const { activeOrganization, organizations } = this.props;
    this.state = {
      copyButtonReady: true,
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
          error: null,
        },
        orguuid: {
          name: "Organization",
          val: activeOrganization.uuid,
          type: "select",
          required: true,
          options: Object.values(organizations).map((o) => ({
            val: o.uuid,
            name: o.name,
          })),
        },
      },
    };

    this.addApiToken = this.addApiToken.bind(this);
    this.tokenCopied = this.tokenCopied.bind(this);
  }

  addApiToken(e) {
    e.preventDefault();
    this.setState({
      message: null,
      messageOk: false,
      showToken: false,
      createdToken: null,
    });
    const { form } = this.state;
    let hasErrors = false;
    let updatedForm = Object.assign({}, form);
    if (!form.name.val) {
      hasErrors = true;
      updatedForm.name.error = "Name is required";
    }
    this.setState({
      form: updatedForm,
    });
    const { addApiToken } = this.props;
    if (!hasErrors) {
      return addApiToken(form.orguuid.val, form.name.val)
        .then((newToken) => {
          this.setState({
            showToken: true,
            createdToken: newToken,
          });
        })
        .catch((err) => {
          this.setState({
            message:
              "New API token couldn't be issued, an error occured on the server.",
          });
        });
    }
  }

  tokenCopied() {
    this.setState({
      copyButtonReady: false,
    });
    setTimeout(() => {
      this.setState({
        copyButtonReady: true,
      });
    }, 600);
  }

  render() {
    const {
      message,
      messageOk,
      redirect,
      form,
      showToken,
      createdToken,
      copyButtonReady,
    } = this.state;
    if (redirect) {
      return <Redirect to="/users/me/tab-api-tokens" />;
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
                      If you need to disable it, you have to delete it on the
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
                  <CopyToClipboard
                    text={createdToken}
                    onCopy={this.tokenCopied}
                  >
                    <button
                      className="btn"
                      type="button"
                      disabled={!copyButtonReady}
                    >
                      {copyButtonReady ? "Copy" : "Copied to clipboard!"}
                    </button>
                  </CopyToClipboard>
                  <button
                    className="btn btn-plain"
                    type="submit"
                    onClick={(e) => {
                      e.preventDefault();
                      this.setState({
                        showToken: false,
                        createdToken: null,
                        redirect: true,
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
                          error: null,
                        }),
                      }),
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
                  <Link to="/users/me/tab-api-tokens" className="btn btn-plain">
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
  (state) => ({
    activeOrganization: state.me.activeOrganization,
    organizations: state.me.organizations,
  }),
  (dispatch) => ({
    addApiToken: (orguuid, name) => dispatch(addUserApiToken(orguuid, name)),
  })
)(AddApiToken);
