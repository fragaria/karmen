import React from 'react';
import Printer from './printer';
import { getPrinters } from '../services/karmen-backend';

class PrinterList extends React.Component {
   state = {
     printers: null,
   }

  async componentDidMount() {
    const printers = await getPrinters(['job', 'status', 'webcam']);
    this.setState({
      printers
    });
  }

  render () {
    const { printers } = this.state;
    if (printers === null) {
      return <p>Loading printers</p>;
    }
    const printerElements = printers.map((p) => {
      return <Printer key={p.mac} printer={p} />
    });
    return (<div>{printerElements}</div>);
  }
}

export default PrinterList;