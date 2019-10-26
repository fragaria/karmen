import React from 'react';

import Loader from '../components/loader';
import { FormInputs } from '../components/form-utils';
import { getSettings, changeSettings, enqueueTask } from '../services/karmen-backend';

class Settings extends React.Component {
  state = {
    init: true,
    submitting: false,
    settings: {
      network_interface: {
        name: "On which network interface should we be looking for printers?",
        val: '',
        type: 'text',
        required: true,
        error: null,
      },
    },
    message: null,
    messageOk: false,
  }

  constructor(props) {
    super(props);
    this.startNetworkScan = this.startNetworkScan.bind(this);
    this.loadSettings = this.loadSettings.bind(this);
  }

  loadSettings() {
    const { settings } = this.state;
    getSettings().then((serverSide) => {
      // eslint-disable-next-line no-unused-vars
      for (let option of serverSide) {
        if (settings[option.key]) {
          settings[option.key].val = option.val;
        }
      }
      this.setState({
        settings,
        init: false,
      });
    });
  }

  componentDidMount() {
    this.loadSettings();
  }

  startNetworkScan(e) {
    e.preventDefault();
    this.setState({
      message: null,
      messageOk: false,
      submitting: true,
    });
    const { settings } = this.state;
    let hasErrors = false;
    const updatedSettings = Object.assign({}, settings);
    const changedSettings = [];
    // eslint-disable-next-line array-callback-return
    Object.keys(settings).map((opt) => {
      if (settings[opt].required && settings[opt].type === 'text' && !settings[opt].val) {
        hasErrors = true;
        updatedSettings[opt].error = 'This is a required field!';
      }
      changedSettings.push({
        key: opt,
        val: settings[opt].val,
      });
    })
    this.setState({
      settings: updatedSettings,
    });
    if (!hasErrors) {
      changeSettings(changedSettings)
        .then((r) => {
          switch(r) {
            case 201:
              enqueueTask("scan_network")
                .then((r) => {
                  switch(r) {
                    case 202:
                      this.setState({
                        message: 'Network scan initiated, the printers should start popping up at any moment',
                        messageOk: true,
                        submitting: false,
                      });
                      break;
                    case 400:
                    default:
                      this.setState({
                        message: 'Cannot scan the network, check server logs',
                        submitting: false,
                      });
                  }
                });
              break;
            case 400:
            default:
              this.setState({
                message: 'Cannot scan the network, check server logs',
                submitting: false,
              });
          }
        });
    } else {
      this.setState({
        submitting: false,
      });
    }
  }

  render () {
    const { init, submitting, settings, message, messageOk } = this.state;
    if (init) {
      return (<div><Loader /></div>);
    }
    const updateValue = (name, value) => {
      const { settings } = this.state;
      this.setState({
        settings: Object.assign({}, settings, {
          [name]: Object.assign({}, settings[name], {val: value, error: null})
        })
      });
    }
    return (
      <div className="settings standalone-page">
        <header>
          <h1 className="title">Settings</h1>
        </header>
        <form>
          <fieldset>
            {message && <p className={messageOk ? "message-success" : "message-error"}>{message}</p>}
            <FormInputs definition={settings} updateValue={updateValue} />
            <div className="form-actions">
              <button type="submit" onClick={this.startNetworkScan} disabled={submitting}>Scan the network for printers</button>
            </div>
          </fieldset>
         </form>
      </div>
    );
  }
}

export default Settings;