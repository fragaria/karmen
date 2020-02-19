import React from "react";
import { Redirect, Link } from "react-router-dom";
import { connect } from "react-redux";
import { addPrinter } from "../actions/printers";
import { FormInputs } from "../components/forms/form-utils";
import OrgRoleBasedGateway from "../components/gateways/org-role-based-gateway";
import BusyButton from "../components/utils/busy-button";

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
        error: null
      },
      address: {
        name: "Printer address",
        val: "",
        type: "text",
        required: true,
        error: null
      },
      apiKey: {
        name: "API key",
        val: "",
        type: "text",
        required: false,
        error: null
      }
    }
  };

  constructor(props) {
    super(props);
    this.addPrinter = this.addPrinter.bind(this);
  }

  addPrinter(e) {
    e.preventDefault();
    this.setState({
      message: null,
      messageOk: false
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
      form.address.val.match(
        /^(https?:\/\/)?([0-9a-zA-Z.-]+\.local|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):?\d{0,5}?\/?[^?#]*$/
      ) === null
    ) {
      hasErrors = true;
      updatedForm.address.error =
        "Printer address is required in a proper format (like http://1.2.3.4:81 or karmen-pill.local/octoprint/)";
    }
    this.setState({
      form: updatedForm
    });
    const { createPrinter } = this.props;
    if (!hasErrors) {
      let protocol = "http";
      let hostname, ip, port;
      let raw = form.address.val;
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
      return createPrinter(
        protocol,
        hostname,
        ip,
        port,
        url.pathname,
        form.name.val,
        form.apiKey.val
      ).then(r => {
        switch (r.status) {
          case 201:
            this.setState({
              redirect: true
            });
            break;
          case 409:
            this.setState({
              message: "Printer on this address is already registered"
            });
            break;
          default:
            this.setState({
              message: "Cannot add printer, check server logs"
            });
        }
      });
    }
  }

  render() {
    const { form, message, messageOk, redirect } = this.state;
    if (redirect) {
      return <Redirect to="/" />;
    }
    return (
      <OrgRoleBasedGateway requiredRole="admin">
        <div className="content">
          <div className="container">
            <h1 className="main-title text-center">Add a new printer</h1>
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
                <BusyButton
                  className="btn"
                  type="submit"
                  onClick={this.addPrinter}
                  busyChildren="Adding..."
                >
                  Add printer
                </BusyButton>{" "}
                <Link to="/" className="btn btn-plain">
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </OrgRoleBasedGateway>
    );
  }
}

export default connect(null, dispatch => ({
  createPrinter: (protocol, hostname, ip, port, path, name, apiKey) =>
    dispatch(addPrinter(protocol, hostname, ip, port, path, name, apiKey))
}))(AddPrinter);
