import React from 'react';
import { Redirect } from 'react-router-dom';

import { FormInputs } from '../components/form-utils';
import { addPrinter } from '../services/karmen-backend';

class AddPrinter extends React.Component {
  state = {
    redirect: false,
    submitting: false,
    message: null,
    form: {
      name: {
        name: "New printer's name",
        val: '',
        type: 'text',
        required: true,
        error: null,
      },
      ip: {
        name: "IP address",
        val: '',
        type: 'text',
        required: true,
        error: null,
      }
    }
  }

  constructor(props) {
    super(props);
    this.addPrinter = this.addPrinter.bind(this);
  }

  addPrinter(e) {
    e.preventDefault();
    this.setState({
      message: null,
      submitting: true,
    });
    const { form } = this.state;
    let hasErrors = false;
    let updatedForm = Object.assign({}, form);
    if (!form.name.val) {
      hasErrors = true;
      updatedForm.name.error = 'Name is required';
    }
    if (!form.ip.val || form.ip.val.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:?\d{0,5}$/) === null) {
      hasErrors = true;
      updatedForm.ip.error = 'IP address is required in a proper format'
    }
    this.setState({
      form: updatedForm,
    });
    if (!hasErrors) {
      addPrinter(form.ip.val, form.name.val)
        .then((r) => {
          switch(r) {
            case 201:
              this.setState({
                submitting: false,
                redirect: true,
              });
              break;
            case 409:
              this.setState({
                message: 'Printer on this IP address is already registered',
                submitting: false,
              });
              break;
            case 400:
            default:
              this.setState({
                message: 'Cannot add printer, check server logs',
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
    const { form, message, redirect, submitting } = this.state;
    if (redirect) {
      return <Redirect to="/" />
    }
    return (
      <div>
        <h1>Add a printer</h1>
        <div>
          <form>
            {message && <p>{message}</p>}
            <FormInputs definition={form} updateValue={(name, value) => {
              this.setState({
                form: Object.assign({}, form, {
                  [name]: Object.assign({}, form[name], {
                    val: value,
                    error: null,
                  })
                }),
              })
            }} />
            <p>
              <button type="submit" onClick={this.addPrinter} disabled={submitting}>Add printer</button>
            </p>
           </form>
        </div>
      </div>
    );
  }
}

export default AddPrinter;