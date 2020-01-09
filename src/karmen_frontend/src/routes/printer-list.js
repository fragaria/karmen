import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Loader from '../components/loader';
import PrinterView from '../components/printer-view';
import { loadAndQueuePrinters, deletePrinter, changeCurrentJob } from '../actions/printers';

class PrinterList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      timer: null,
    }
    this.getPrinters = this.getPrinters.bind(this);
  }

  componentDidMount() {
    this.getPrinters();
  }

  getPrinters() {
    const { printersLoaded, loadPrinters } = this.props;
    let load;
    if (printersLoaded) {
      load = loadPrinters(['status']);
    } else {
      load = loadPrinters(['job', 'status', 'webcam']);
    }
    // We are periodically checking for new printers - this is
    // required for the printers to show up after the network scan
    // or added in a different client.
    // But we are checking only for the local db data, so it should be blazing fast.
    load.then(() => {
      this.setState({
        timer: setTimeout(this.getPrinters, 60 * 1000),
      });
    });
  }

  componentWillUnmount() {
    const { timer } = this.state;
    timer && clearTimeout(timer);
   }

  render () {
    const { userRole, printersLoaded, printers, deletePrinter, changeCurrentJobState } = this.props;
    if (!printersLoaded) {
      return <div><Loader /></div>;
    }
    const printerElements = printers && printers.map((p) => {
      return <div key={p.host} className="content-box">
        <PrinterView
          printer={p}
          onPrinterDelete={deletePrinter}
          showActions={userRole === 'admin'}
          canChangeCurrentJob={true}
          changeCurrentJobState={changeCurrentJobState}
        />
      </div>
    });
    return (
      <div className="printer-list">
        <header>
          <h1 className="title">Printers</h1>
          {userRole === 'admin' && 
            <Link to="/add-printer" className="action">
              <i className="icon icon-plus"></i>&nbsp;
              <span>Add a printer</span>
            </Link>
          }
        </header>
        <div className="boxed-content">
          {printerElements}
         </div>
      </div>
    );
  }
}

export default connect(
  state => ({
    printers: state.printers.printers,
    printersLoaded: state.printers.printersLoaded,
    userRole: state.users.me.role,
  }),
  dispatch => ({
    loadPrinters: (fields) => (dispatch(loadAndQueuePrinters(fields))),
    changeCurrentJobState: (host, action) => (dispatch(changeCurrentJob(host, action))),
    deletePrinter: (host) => (dispatch(deletePrinter(host))),
  })
)(PrinterList);