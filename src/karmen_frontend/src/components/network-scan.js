import React from "react";

import Loader from "../components/loader";
import { FormInputs } from "../components/form-utils";
import BusyButton from "../components/busy-button";

class NetworkScan extends React.Component {
  state = {
    init: true,
    settings: {
      network_interface: {
        name: "On which network interface should we be looking for printers?",
        val: "",
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
    this.loadNetworkScan = this.loadNetworkScan.bind(this);
  }

  loadNetworkScan() {
    const { settings } = this.state;
    const { getSettings } = this.props;
    getSettings().then(r => {
      // eslint-disable-next-line no-unused-vars
      for (let option of r.data) {
        if (settings[option.key]) {
          settings[option.key].val = option.val;
        }
      }
      this.setState({
        settings,
        init: false
      });
    });
  }

  componentDidMount() {
    this.loadNetworkScan();
  }

  startNetworkScan(e) {
    e.preventDefault();
    this.setState({
      message: null,
      messageOk: false
    });
    const { settings } = this.state;
    const { changeSettings, enqueueTask } = this.props;
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
      return changeSettings(changedSettings).then(r => {
        switch (r.status) {
          case 201:
            return enqueueTask("scan_network").then(r => {
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
    const { init, settings, message, messageOk } = this.state;
    if (init) {
      return (
        <div>
          <Loader />
        </div>
      );
    }
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
