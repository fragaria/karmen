import React from "react";
import { Redirect } from "react-router-dom";
import { connect } from "react-redux";
import { BackLink } from "../components/back";
import { FormInputs } from "../components/form-utils";
import { addPrinter } from "../actions/printers";
import RoleBasedGateway from "../components/role-based-gateway";

class AddPrinter extends React.Component {
  state = {
    redirect: false,
    submitting: false,
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
      messageOk: false,
      submitting: true
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
        /^(https?:\/\/)?([0-9a-zA-Z.-]+\.local|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):?\d{0,5}?$/
      ) === null
    ) {
      hasErrors = true;
      updatedForm.address.error =
        "Printer address is required in a proper format (like http://1.2.3.4:81 or octopi.local)";
    }
    this.setState({
      form: updatedForm
    });
    const { createPrinter } = this.props;
    if (!hasErrors) {
      let protocol = "http";
      let host = form.address.val;
      if (form.address.val.indexOf("//") > -1) {
        const url = new URL(form.address.val);
        protocol = url.protocol.replace(":", "");
        host = url.host;
      }
      createPrinter(protocol, host, form.name.val, form.apiKey.val).then(r => {
        switch (r.status) {
          case 201:
            this.setState({
              submitting: false,
              redirect: true
            });
            break;
          case 409:
            this.setState({
              message: "Printer on this address is already registered",
              submitting: false
            });
            break;
          default:
            this.setState({
              message: "Cannot add printer, check server logs",
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
    if (redirect) {
      return <Redirect to="/" />;
    }
    return (
      <RoleBasedGateway requiredRole="admin">
        <div className="standalone-page">
          <header>
            <h1 className="title">Add a new printer</h1>
          </header>
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
                onClick={this.addPrinter}
                disabled={submitting}
              >
                Add printer
              </button>
              <BackLink to="/" />
            </div>
          </form>
        </div>
      </RoleBasedGateway>
    );
  }
}

export default connect(null, dispatch => ({
  createPrinter: (protocol, host, name, apiKey) =>
    dispatch(addPrinter(protocol, host, name, apiKey))
}))(AddPrinter);
