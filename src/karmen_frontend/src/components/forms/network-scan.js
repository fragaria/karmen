import React from "react";
import BusyButton from "../utils/busy-button";
import { FormInputs } from "./form-utils";

class NetworkScan extends React.Component {
  state = {
    settings: {
      network_interface: {
        name: "On which network interface should we be looking for printers?",
        val: "wlan0", // TODO move to redux preferences
        type: "text",
        required: true,
        error: null
      }
    },
    message: null,
    messageOk: false
  };

  constructor(props) {
    super(props);
    this.startNetworkScan = this.startNetworkScan.bind(this);
  }

  startNetworkScan(e) {
    e.preventDefault();
    this.setState({
      message: null,
      messageOk: false
    });
    const { settings } = this.state;
    const { scanNetwork } = this.props;
    let hasErrors = false;
    const updatedSettings = Object.assign({}, settings);
    const changedSettings = [];
    // eslint-disable-next-line array-callback-return
    Object.keys(settings).map(opt => {
      if (
        settings[opt].required &&
        settings[opt].type === "text" &&
        !settings[opt].val
      ) {
        hasErrors = true;
        updatedSettings[opt].error = "This is a required field!";
      }
      changedSettings.push({
        key: opt,
        val: settings[opt].val
      });
    });
    this.setState({
      settings: updatedSettings
    });
    if (!hasErrors) {
      return scanNetwork(settings.network_interface.val).then(r => {
        switch (r.status) {
          case 202:
            this.setState({
              message:
                "Network scan initiated, the printers should start popping up at any moment",
              messageOk: true
            });
            break;
          case 400:
          default:
            this.setState({
              message: "Cannot scan the network, check server logs"
            });
        }
      });
    }
  }

  render() {
    const { settings, message, messageOk } = this.state;
    const updateValue = (name, value) => {
      const { settings } = this.state;
      this.setState({
        settings: Object.assign({}, settings, {
          [name]: Object.assign({}, settings[name], { val: value, error: null })
        })
      });
    };
    return (
      <form>
        <fieldset>
          {message && (
            <p className={messageOk ? "message-success" : "message-error"}>
              {message}
            </p>
          )}
          <FormInputs definition={settings} updateValue={updateValue} />
          <div className="cta-box text-center">
            <BusyButton
              className="btn"
              type="submit"
              onClick={this.startNetworkScan}
              busyChildren="Enqueing scan..."
            >
              Scan the network for printers
            </BusyButton>
          </div>
        </fieldset>
      </form>
    );
  }
}

export default NetworkScan;
