import React from 'react';

import { getSettings, changeSettings } from '../services/karmen-backend';


class Settings extends React.Component {
  state = {
    settings: {
      'network_discovery': {
        "name": "Discover printers on the network?",
        "val": true,
        'type': 'checkbox',
      },
      'network_interface': {
        "name": "On which network?",
        "val": '',
        'type': 'text',
      },
      'network_retry_device_after': {
        "name": "After how much time should we check again with a non-responding device?",
        "val": 3600,
        'type': 'select',
        'options': [
          {'name': '1 hour', 'val': 3600},
          {'name': '10 minutes', 'val': 600},
        ]
      }
    },
    error: null,
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
      });
    });
  }

  componentDidMount() {
    this.loadSettings();
  }

  changeSettings(e) {
    e.preventDefault();
    const { settings } = this.state;
    this.setState({
      error: null,
    });
    const changedSettings = Object.keys(settings).map((opt) => {
      return {
        key: opt,
        val: settings[opt].val,
      }
    })
    changeSettings(changedSettings)
      .then((r) => {
        switch(r) {
          case 201:
            this.setState({
              // TODO not an error
              error: 'Changes saved successfully',
            });
            break;
          case 400:
          default:
            this.setState({
              error: 'Cannot save your changes, check server logs',
            });
        }
      });
  }

  render () {
    const { settings, error } = this.state;
    const optionRows = Object.keys(settings).map((name) => {
      const updateValue = (name, value) => {
        const { settings } = this.state;
        this.setState({
          settings: Object.assign({}, settings, {
            [name]: Object.assign({}, settings[name], {val: value})
          })
        });
      }
      switch(settings[name].type) {
        case 'text':
          return (
            <p key={name}>
              <label htmlFor={name}>{settings[name].name}</label>
              <input type="text" id={name} name={name} value={settings[name].val} onChange={(e) => updateValue(name, e.target.value)} required="required" />
            </p>
          );
        case 'checkbox':
          return (
            <p key={name}>
              <label htmlFor={name}>{settings[name].name}</label>
              <input type="checkbox" id={name} name={name} checked={settings[name].val} onChange={(e) => updateValue(name, e.target.checked)} required="required" />
            </p>
          );
        case 'select':
          const opts = settings[name].options.map((opt) => {
            return <option key={opt.val} value={opt.val}>{opt.name}</option>;
          })
          return (
            <p key={name}>
              <label htmlFor={name}>{settings[name].name}</label>
              <select id={name} name={name} value={settings[name].val} onChange={(e) => updateValue(name, e.target.value)} required="required">
                {opts}
              </select>
            </p>
          );
        default:
          return null;
      }
    });
    return (
      <div>
        <h1>Change settings</h1>
        <div>
          <form>
            {error && <p>{error}</p>}
            {optionRows}
            <p>
              <button type="submit" onClick={this.changeSettings}>Save settings</button>
            </p>
           </form>
        </div>
      </div>
    );
  }
}

export default Settings;