import React from 'react';

import Loader from '../components/loader';
import { PrinterConnection, PrinterState } from '../components/printer-view';
import { getPrinter } from '../services/karmen-backend';

class PrinterDetail extends React.Component {
  state = {
    printer: null,
  }

  constructor(props) {
    super(props);
    this.loadPrinter = this.loadPrinter.bind(this);
  }

  loadPrinter() {
    const { match } = this.props;
    getPrinter(match.params.ip, ['job', 'status', 'webcam']).then((printer) => {
      this.setState({
        printer,
      });
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
      <div>
        <h1>
          {printer.name}
        </h1>
        <div>
          <PrinterConnection printer={printer} />
          <PrinterState printer={printer} />
        </div>
      </div>
    );
  }
}

export default PrinterDetail;