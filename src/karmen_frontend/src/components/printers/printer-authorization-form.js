import React from "react";
import BusyButton from "../utils/busy-button";

class PrinterAuthorizationForm extends React.Component {
  state = {
    apiKey: "",
  };

  constructor(props) {
    super(props);
    this.setApiKey = this.setApiKey.bind(this);
  }

  setApiKey(e) {
    e.preventDefault();
    const { apiKey } = this.state;
    const { onPrinterAuthorizationChanged } = this.props;
    return onPrinterAuthorizationChanged({
      api_key: apiKey,
    }).then((r) => {
      this.setState({
        apiKey: "",
      });
    });
  }

  render() {
    const { printer } = this.props;
    const { apiKey } = this.state;
    const getAccessLevelString = (level) => {
      switch (level) {
        case "read_only":
        case "protected":
          return "Unlock with API key";
        case "unlocked":
          return "Full access";
        case "unknown":
        default:
          return "Unknown";
      }
    };
    if (
      !printer.client ||
      ["unlocked", "unknown"].indexOf(printer.client.access_level) !== -1
    ) {
      return <></>;
    }
    return (
      <>
        <p></p>
        <p>{getAccessLevelString(printer.client.access_level)}</p>
        <form className="inline-form inline-form-sm">
          <input
            type="text"
            id="apiKey"
            name="apiKey"
            value={apiKey || ""}
            onChange={(e) => {
              this.setState({
                apiKey: e.target.value,
              });
            }}
          />
          <BusyButton
            className="btn btn-sm"
            type="submit"
            onClick={this.setApiKey}
            busyChildren="Working..."
            disabled={!apiKey}
          >
            Set API key
          </BusyButton>
        </form>
      </>
    );
  }
}

export default PrinterAuthorizationForm;
