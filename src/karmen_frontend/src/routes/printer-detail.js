import React from 'react';

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
    getPrinter(match.params.ip, ['job', 'status', 'webcam', 'printerprofile']).then((printer) => {
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
      return <div></div>;
    }
    return (
      <div>
        <h1>Printer detail {printer.ip}</h1>
        <div>
          
        </div>
      </div>
    );
  }
}

export default PrinterDetail;