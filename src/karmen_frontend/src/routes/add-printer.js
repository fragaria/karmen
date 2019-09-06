import React from 'react';
import { Redirect } from 'react-router-dom';

import { addPrinter } from '../services/karmen-backend';


class AddPrinter extends React.Component {
  state = {
    name: '',
    ip: '',
    error: null,
    redirect: false,
  }

  constructor(props) {
    super(props);
    this.addPrinter = this.addPrinter.bind(this);
  }

  addPrinter(e) {
    e.preventDefault();
    const { name, ip } = this.state;
    if (!ip || !name || ip.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/) === null) {
      this.setState({
        error: 'Both fields are required in the right format'
      });
      return;
    }
    this.setState({
      error: null,
    });
    addPrinter(ip, name)
      .then((r) => {
        switch(r) {
          case 201:
            this.setState({
              ip: '',
              name: '',
              redirect: true,
            });
            break;
          case 409:
            this.setState({
              error: 'Printer on this IP address is already registered',
            });
            break;
          case 400:
          default:
            this.setState({
              error: 'Cannot add printer, check server logs',
            });
        }
      });
  }

  render () {
    const { name, ip, error, redirect } = this.state;
    if (redirect) {
      return <Redirect to="/" />
    }
    return (
      <div>
        <h1>Add a printer</h1>
        <div>
          <form>
            {error && <p>{error}</p>}
            <p>
              <label htmlFor="name">Name</label>
              <input type="text" id="name" name="name" value={name} onChange={(e) => this.setState({name: e.target.value})} required="required" />
            </p>
            <p>
              <label htmlFor="ip">IP address</label>
              <input type="text" id="ip" name="ip" value={ip}  onChange={(e) => this.setState({ip: e.target.value})} required="required" />
             </p>
            <p>
              <button type="submit" onClick={this.addPrinter}>Add printer</button>
            </p>
           </form>
        </div>
      </div>
    );
  }
}

export default AddPrinter;