import React from 'react';
import { Link } from 'react-router-dom';
import Loader from '../components/loader';
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
    if (printers === null || printers === undefined) {
      return <div><Loader /></div>;
    }
    const printerElements = printers && printers.sort((p, r) => p.name > r.name ? 1 : -1).map((p) => {
      return <div key={p.ip} className="content-box"><PrinterView printer={p} onPrinterDelete={(ip) => {
        this.setState({
          printers: printers.filter((p) => p.ip !== ip),
        });
      }} /></div>
    });
    return (
      <div className="printer-list">
        <header>
          <h1 className="title">Printers</h1>
          <Link to="/add-printer" className="action">
            <i className="icon icon-plus"></i>&nbsp;
            <span>Add a printer</span>
          </Link>
        </header>
        <div className="boxed-content">
          {printerElements}
         </div>
      </div>
    );
  }
}

export default PrinterList;