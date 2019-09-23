import React from 'react';
import { Link } from 'react-router-dom';
import Loader from '../components/loader';
import Menu from '../components/menu';
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
      <div className="printer-list boxed-content">
        <div className="content-box"><Menu /></div>
        {printerElements}
        <div className="content-box">
          <div className="add-printer">
            <Link to="/add-printer">
              <i className="icon icon-plus"></i><br />
              Add printer
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

export default PrinterList;