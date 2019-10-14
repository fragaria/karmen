import React from 'react';

import Loader from '../components/loader';
import { PrinterConnection, PrinterState } from '../components/printer-view';
import { WebcamStream } from '../components/webcam-stream';
import { PrinterEditForm } from '../components/printer-edit-form';
import { getPrinter, patchPrinter } from '../services/karmen-backend';

class PrinterDetail extends React.Component {
  state = {
    printer: null,
  }

  constructor(props) {
    super(props);
    this.loadPrinter = this.loadPrinter.bind(this);
    this.changePrinter = this.changePrinter.bind(this);
  }

  loadPrinter() {
    const { match } = this.props;
    getPrinter(match.params.ip, ['job', 'status', 'webcam']).then((printer) => {
      this.setState({
        printer
      });
    });
  }

  changePrinter(newParameters) {
    const { printer } = this.state;
    return patchPrinter(printer.ip, newParameters)
      .then((r) => {
        switch(r) {
          case 204:
            this.setState({
              printer: Object.assign({}, printer, newParameters),
            });
            return {
              ok: true,
              message: 'Changes saved successfully'
            };
          case 400:
          default:
            return {
              ok: false,
              message: 'Cannot save your changes, check server logs',
            };
        }
      });
  }

  componentDidMount() {
    this.loadPrinter();
  }

  render () {
    const { printer } = this.state;
    if (!printer) {
      return <div><Loader /></div>;
    }
    return (
      <div className="printer-detail standalone-page">
        <header>
          <h1 className="title">
            {printer.name}
          </h1>
        </header>
        <div>
          <div className="printer-info">
            <div >
              <PrinterConnection printer={printer} />
              <PrinterState printer={printer} />
              <div>
                <h2 className="hidden">Change printer properties</h2>
                <PrinterEditForm
                  defaults={{name: printer.name}}
                  onSubmit={this.changePrinter}
                  onCancel={() => {
                    this.props.history.push('/');
                  }}
                />
              </div>
            </div>
            <WebcamStream {...printer.webcam} />
          </div>
        </div>
      </div>
    );
  }
}

export default PrinterDetail;