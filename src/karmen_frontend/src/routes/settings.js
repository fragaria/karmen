import React from 'react';

import Loader from '../components/loader';
import { FormInputs } from '../components/form-utils';
import { getSettings, changeSettings } from '../services/karmen-backend';

class Settings extends React.Component {
  state = {
    init: true,
    submitting: false,
    settings: {
      network_discovery: {
        name: "Discover printers on the network?",
        val: true,
        type: 'checkbox',
        required: true,
        error: null,
      },
      network_interface: {
        name: "On which network?",
        val: '',
        type: 'text',
        required: true,
        error: null,
      },
      network_retry_device_after: {
        name: "After how much time should we check again with a non-responding device?",
        val: 3600,
        type: 'select',
        options: [
          {name: '1 hour', val: 3600},
          {name: '10 minutes', val: 600},
        ],
        required: true,
        error: null,
      }
    },
    message: null,
  }

  constructor(props) {
    super(props);
    this.changeSettings = this.changeSettings.bind(this);
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

  changeSettings(e) {
    e.preventDefault();
    this.setState({
      message: null,
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
              this.setState({
                message: 'Changes saved successfully',
                submitting: false,
              });
              break;
            case 400:
            default:
              this.setState({
                message: 'Cannot save your changes, check server logs',
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
    const { init, submitting, settings, message } = this.state;
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
      <div>
        <h1>Change settings</h1>
        <div>
          <form>
            {message && <p>{message}</p>}
            <FormInputs definition={settings} updateValue={updateValue} />
            <p>
              <button type="submit" onClick={this.changeSettings} disabled={submitting}>Save settings</button>
            </p>
           </form>
        </div>
      </div>
    );
  }
}

export default Settings;