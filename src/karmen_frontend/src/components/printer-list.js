import React from 'react';
import Printer from './printer';
import { getPrinters } from '../services/karmen-backend';

class PrinterList extends React.Component {
  state = {
    printers: null,
    timer: null,
  }

  constructor(props) {
    super(props);
    this.loadPrinters = this.loadPrinters.bind(this);
  }

  async loadPrinters() {
    const printers = await getPrinters(['job', 'status', 'webcam']);
    this.setState({
      printers,
      timer: setTimeout(this.loadPrinters, 3000),
    });
  }

  async componentDidMount() {
    this.loadPrinters();
  }

  render () {
    const { printers } = this.state;
    if (printers === null) {
      return <p>Loading printers</p>;
    }
    const printerElements = printers.sort((p, r) => p.name > r.name ? 1 : -1).map((p) => {
      return <Printer key={p.ip} printer={p} />
    });
    return (<div>{printerElements}</div>);
  }
}

export default PrinterList;