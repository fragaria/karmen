import React from "react";
import { Link, useHistory } from "react-router-dom";
import { connect } from "react-redux";
import SetActiveOrganization from "../../components/gateways/set-active-organization";
import { FormInputs } from "../../components/forms/form-utils";
import OrgRoleBasedGateway from "../../components/gateways/org-role-based-gateway";
import BusyButton from "../../components/utils/busy-button";
import { addPrinter, issuePrinterToken } from "../../actions";

export class AddPrinterForm extends React.Component {
  onpremiseAddressConfig = {
    name: "Printer address",
    helpText: <span>Please enter full address to your machine.</span>,
  };

  pillAddressConfig = {
    name: "Printer code",
    helpText: (
      <span>Please enter code from the Pill configuration wizard.</span>
    ),
    disabled: false,
    clipboardSupport: false,
  };

  otherAddressConfig = {
    name: "Connection key",
    helpText: (
      <span>
        Use this connection key for connecting your device via{" "}
        <a
          href="https://github.com/fragaria/websocket-proxy"
          target="_blank"
          rel="noopener noreferrer"
        >
          websocket-proxy
        </a>
        .
      </span>
    ),
    disabled: true,
    clipboardSupport: true,
  };

  state = {
    message: null,
    messageOk: false,
    issuedToken: null,
    form: {
      ...(window.env.IS_CLOUD_INSTALL
        ? {
            deviceType: {
              name: "I'm adding",
              val: "pill",
              type: "select",
              options: [
                { name: "Karmen Pill", val: "pill" },
                { name: "Other device", val: "other" },
              ],
              required: true,
              error: null,
            },
          }
        : {}),
      name: {
        name: "New printer's name",
        val: "",
        type: "text",
        required: true,
        error: null,
      },
      address: {
        val: "",
        type: "text",
        required: true,
        error: null,
        ...(window.env.IS_CLOUD_INSTALL
          ? this.pillAddressConfig
          : this.onpremiseAddressConfig),
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
    this.onUpdate = this.onUpdate.bind(this);
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
    const { createPrinter, onCreate } = this.props;
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
        port = parseInt(url.port) || null;
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
            onCreate();
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

  async getPrinterToken() {
    if (!this.state.issuedToken) {
      try {
        this.setState({
          issuedToken: await this.props.issueToken(),
        });
      } catch (err) {
        this.setState({
          message:
            "Could not retreive a new connection key for you, please try refreshing this page.",
        });
        return null;
      }
    }
    return this.state.issuedToken;
  }

  onUpdate(name, value) {
    const updatedForm = this.updateFormValues(name, value);

    this.setState({ form: updatedForm }, async () => {
      if (name === "deviceType" && window.env.IS_CLOUD_INSTALL) {
        if (value === "other") {
          const token = await this.getPrinterToken();

          // Only set if the value didn't change in the meantime
          if (this.state.form.deviceType.val === "other" && token) {
            this.setState({
              form: Object.assign({}, this.state.form, {
                address: Object.assign({}, this.state.form.address, {
                  val: token,
                  error: "",
                }),
              }),
            });
          }
        } else {
          this.setState({
            form: Object.assign({}, this.state.form, {
              address: Object.assign({}, this.state.form.address, {
                val: "",
                error: null,
              }),
            }),
          });
        }
      }
    });
  }

  updateFormValues(name, value) {
    const out = Object.assign({}, this.state.form);

    if (name === "deviceType" && window.env.IS_CLOUD_INSTALL) {
      out.address = Object.assign(out.address, {
        ...(value === "pill"
          ? this.pillAddressConfig
          : this.otherAddressConfig),
      });
    }

    for (const key in out) {
      if (out[key].type === "collapsible" && out[key].inputs[name]) {
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
    const { form, message, messageOk } = this.state;
    const { children } = this.props;
    return (
      <>
        <h1 className="main-title text-center">Add a new printer</h1>
        <form>
          {message && (
            <p className={messageOk ? "message-success" : "message-error"}>
              {message}
            </p>
          )}
          <FormInputs definition={form} updateValue={this.onUpdate} />
          <div className="cta-box text-center">
            <BusyButton
              className="btn"
              type="submit"
              onClick={this.addPrinter}
              busyChildren="Adding..."
            >
              Add printer
            </BusyButton>{" "}
            {children && children}
          </div>
        </form>
      </>
    );
  }
}

export const AddPrinter = ({ orguuid, issueToken, createPrinter }) => {
  const history = useHistory();

  const onCreate = () => {
    history.push(`/${orguuid}/settings/tab-printers`);
  };

  return (
    <>
      <SetActiveOrganization />
      <OrgRoleBasedGateway requiredRole="admin">
        <div className="content">
          <div className="container">
            <AddPrinterForm
              orguuid={orguuid}
              issueToken={issueToken}
              createPrinter={createPrinter}
              onCreate={onCreate}
            >
              <Link
                to={`/${orguuid}/settings/tab-printers`}
                className="btn btn-plain"
              >
                Cancel
              </Link>
            </AddPrinterForm>
          </div>
        </div>
      </OrgRoleBasedGateway>
    </>
  );
};

export default connect(null, (dispatch, ownProps) => ({
  orguuid: ownProps.match.params.orguuid,
  issueToken: () => dispatch(issuePrinterToken(ownProps.match.params.orguuid)),
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
