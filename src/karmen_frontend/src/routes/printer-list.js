import React from 'react';
import PrinterView from '../components/printer-view';
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

  loadPrinters() {
    getPrinters(['job', 'status', 'webcam']).then((printers) => {
      this.setState({
        printers,
        timer: setTimeout(this.loadPrinters, 3000),
      });
    });
  }

  componentDidMount() {
    this.loadPrinters();
  }

  componentWillUnmount() {
    const { timer } = this.state;
    if (timer) {
      clearTimeout(timer);
    }
  }

  render () {
    const { printers } = this.state;
    if (printers === null) {
      return <p>Loading printers</p>;
    }
    const printerElements = printers.sort((p, r) => p.name > r.name ? 1 : -1).map((p) => {
      return <PrinterView key={p.ip} printer={p} onPrinterDelete={(ip) => {
        this.setState({
          printers: printers.filter((p) => p.ip !== ip),
        });
      }} />
    });
    return (
      <div>
        {printerElements.length === 0 && <p>No printers found</p>}
        {printerElements}
      </div>
    );
  }
}

export default PrinterList;