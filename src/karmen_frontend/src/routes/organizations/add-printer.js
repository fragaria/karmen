import React from "react";
import { Redirect, Link } from "react-router-dom";
import { connect } from "react-redux";
import SetActiveOrganization from "../../components/gateways/set-active-organization";
import { FormInputs } from "../../components/forms/form-utils";
import OrgRoleBasedGateway from "../../components/gateways/org-role-based-gateway";
import BusyButton from "../../components/utils/busy-button";
import { addPrinter } from "../../actions";

class AddPrinter extends React.Component {
  state = {
    redirect: false,
    message: null,
    messageOk: false,
    form: {
      name: {
        name: "New printer's name",
        val: "",
        type: "text",
        required: true,
        error: null,
      },
      address: {
        name: window.env.IS_CLOUD_INSTALL ? "Printer code" : "Printer address",
        val: "",
        type: "text",
        required: true,
        error: null,
      },
      collapsible: {
        type: "collapsible",
        collapsedStateText: "Advanced options",
        expandedStateText: "Hide advanced options",
        inputs: {
          apiKey: {
            name: "API key",
            val: "",
            type: "text",
            required: false,
            error: null,
          },
        },
      },
    },
  };

  constructor(props) {
    super(props);
    this.addPrinter = this.addPrinter.bind(this);
  }

  addPrinter(e) {
    e.preventDefault();
    this.setState({
      message: null,
      messageOk: false,
    });
    const { form } = this.state;
    let hasErrors = false;
    let updatedForm = Object.assign({}, form);
    if (!form.name.val) {
      hasErrors = true;
      updatedForm.name.error = "Name is required";
    }
    if (
      !form.address.val ||
      //do not check hostname in cloud installation - printer is added by token
      (window.env.IS_CLOUD_INSTALL
        ? false
        : form.address.val.match(
            /^(https?:\/\/)?([0-9a-zA-Z.-]+\.local|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):?\d{0,5}?\/?[^?#]*$/
          ) === null)
    ) {
      hasErrors = true;
      updatedForm.address.error =
        "Printer address is required in a proper format (like http://1.2.3.4:81 or karmen-pill.local/octoprint/)";
    }
    this.setState({
      form: updatedForm,
    });
    const { createPrinter } = this.props;
    if (!hasErrors) {
      let protocol = "http";
      let hostname, ip, port, path, token;
      let raw = form.address.val;
      if (window.env.IS_CLOUD_INSTALL) {
        token = raw;
      } else {
        if (raw.indexOf("//") === -1) {
          raw = `${protocol}://${raw}`;
        }
        const url = new URL(raw);
        protocol = url.protocol.replace(":", "");
        port = url.port || null;
        if (
          url.hostname &&
          url.hostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/) === null
        ) {
          hostname = url.hostname;
        } else {
          ip = url.hostname;
        }
        path =
          url.pathname.length > 0 && url.pathname !== "/" ? url.pathname : "";
      }

      return createPrinter(
        protocol,
        hostname,
        ip,
        port,
        path,
        token,
        form.name.val,
        form.collapsible.inputs.apiKey.val
      ).then((r) => {
        switch (r.status) {
          case 201:
            this.setState({
              redirect: true,
            });
            break;
          case 409:
            this.setState({
              message: "Printer on this address is already registered",
            });
            break;
          default:
            this.setState({
              message: "Cannot add printer, check server logs",
            });
        }
      });
    }
  }

  updateValue(form, name, value) {
    const out = Object.assign({}, form);
    for (const key in form) {
      if (form[key].type === "collapsible" && form[key].inputs[name]) {
        out[key].inputs[name].val = value;
        out[key].inputs[name].error = null;
      } else if (key === name) {
        out[key].val = value;
        out[key].error = null;
      }
    }
    return out;
  }

  render() {
    const { form, message, messageOk, redirect } = this.state;
    const { match } = this.props;
    if (redirect) {
      return <Redirect to={`/${match.params.orguuid}/settings/tab-printers`} />;
    }
    return (
      <>
        <SetActiveOrganization />
        <OrgRoleBasedGateway requiredRole="admin">
          <div className="content">
            <div className="container">
              <h1 className="main-title text-center">Add a new printer</h1>
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
                      form: this.updateValue(form, name, value),
                    });
                  }}
                />
                <div className="cta-box text-center">
                  <BusyButton
                    className="btn"
                    type="submit"
                    onClick={this.addPrinter}
                    busyChildren="Adding..."
                  >
                    Add printer
                  </BusyButton>{" "}
                  <Link
                    to={`/${match.params.orguuid}/settings/tab-printers`}
                    className="btn btn-plain"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </OrgRoleBasedGateway>
      </>
    );
  }
}

export default connect(null, (dispatch, ownProps) => ({
  createPrinter: (protocol, hostname, ip, port, path, token, name, apiKey) =>
    dispatch(
      addPrinter(
        ownProps.match.params.orguuid,
        protocol,
        hostname,
        ip,
        port,
        path,
        token,
        name,
        apiKey
      )
    ),
}))(AddPrinter);
