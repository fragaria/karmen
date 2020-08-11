import React from "react";
import BusyButton from "../utils/busy-button";

class NetworkScan extends React.Component {
  state = {
    error: null,
    message: null,
    messageOk: false,
  };

  constructor(props) {
    super(props);
    this.startNetworkScan = this.startNetworkScan.bind(this);
  }

  startNetworkScan(e) {
    e.preventDefault();
    this.setState({
      message: null,
      messageOk: false,
    });
    const { scanNetwork, networkInterface } = this.props;
    if (!networkInterface) {
      this.setState({
        error: "Network name cannot be empty!",
      });
      return;
    }
    return scanNetwork(networkInterface)
      .then((r) => {
        this.setState({
          message:
            "Network scan initiated, the printers should start popping up at any moment",
          messageOk: true,
        });
      })
      .catch((err) => {
        this.setState({
          message: "Cannot scan the network, check server logs",
        });
      });
  }

  render() {
    const { error, message, messageOk } = this.state;
    const { networkInterface, onNetworkInterfaceChange } = this.props;
    return (
      <form>
        <fieldset>
          {message && (
            <p className={messageOk ? "message-success" : "message-error"}>
              {message}
            </p>
          )}
          <div className="input-group">
            <label htmlFor="networkInterface">
              On which network interface should we be looking for printers?
            </label>
            <input
              type="text"
              id="networkInterface"
              name="networkInterface"
              value={networkInterface}
              onChange={(e) => {
                onNetworkInterfaceChange(e.target.value);
              }}
            />
            <span>{error && <small>{error}</small>}</span>
          </div>
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
