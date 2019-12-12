import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Loader from '../components/loader';
import PrinterView from '../components/printer-view';
import { loadPrinters, deletePrinter, changeCurrentJob } from '../actions/printers';

class PrinterList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      timer: null,
    }
    this.refreshPrinters = this.refreshPrinters.bind(this);
  }

  componentDidMount() {
    this.refreshPrinters();
  }

  refreshPrinters() {
    const { loadPrinters } = this.props;
    loadPrinters().then(() => {
      this.setState({
        timer: setTimeout(this.refreshPrinters, Math.floor(Math.random()*(4000+1)+3000)),
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
          canChangeCurrentJob={userRole === 'admin'}
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
    loadPrinters: () => (dispatch(loadPrinters(['job', 'status', 'webcam']))),
    changeCurrentJobState: (host, action) => (dispatch(changeCurrentJob(host, action))),
    deletePrinter: (host) => (dispatch(deletePrinter(host))),
  })
)(PrinterList);