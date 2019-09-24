import React from 'react';

import Loader from '../components/loader';
import { BackLink } from '../components/back';
import { FormInputs } from '../components/form-utils';
import { PrinterConnection, PrinterState, WebcamStream } from '../components/printer-view';
import { getPrinter, patchPrinter } from '../services/karmen-backend';

class PrinterDetail extends React.Component {
  state = {
    printer: null,
    submitting: false,
    message: null,
    form: {
      name: {
        name: "Printer's new name",
        val: '',
        type: 'text',
        required: true,
        error: null,
      }
    }
  }

  constructor(props) {
    super(props);
    this.loadPrinter = this.loadPrinter.bind(this);
    this.changeName = this.changeName.bind(this);
  }

  loadPrinter() {
    const { match } = this.props;
    const { form } = this.state;
    getPrinter(match.params.ip, ['job', 'status', 'webcam']).then((printer) => {
      this.setState({
        printer,
        form: Object.assign({}, form, {
          name: Object.assign({}, form.name, {
            val: printer.name,
          })
        })
      });
    });
  }

  changeName(e) {
    e.preventDefault();
    this.setState({
      submitting: true,
    });
    const { printer, form } = this.state;
    if (!form.name.val) {
      this.setState({
        submitting: false,
        form: Object.assign({}, form, {
          name: Object.assign({}, form.name, {
            error: 'Name cannot be empty',
          })
        })
      });
      return;
    }
    patchPrinter(printer.ip, {name: form.name.val})
      .then((r) => {
        switch(r) {
          case 204:
            this.setState({
              printer: Object.assign({}, printer, {name: form.name.val}),
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
  }

  componentDidMount() {
    this.loadPrinter();
  }

  render () {
    const { printer, message, form, submitting } = this.state;
    if (!printer) {
      return <div><Loader /></div>;
    }
    const updateValue = (name, value) => {
      const { form } = this.state;
      this.setState({
        form: Object.assign({}, form, {
          [name]: Object.assign({}, form[name], {val: value, error: null})
        })
      });
    }
    return (
      <div className="printer-detail standalone-page">
        <BackLink to="/" />
        <h1>
          {printer.name}
        </h1>
        <div>
          <div>
            <h2 class="hidden">Change printer properties</h2>
            <form>
              {message && <p>{message}</p>}
              <FormInputs definition={form} updateValue={updateValue} />
              <p>
                <button type="submit" onClick={this.changeName} disabled={submitting}>Save</button>
              </p>
             </form>
          </div>
          <div className="printer-info">
            <div >
              <PrinterConnection printer={printer} />
              <PrinterState printer={printer} />
            </div>
            {printer.webcam.stream && <WebcamStream {...printer.webcam} />}
          </div>
        </div>
      </div>
    );
  }
}

export default PrinterDetail;