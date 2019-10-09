import React from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';

import Loader from '../components/loader';
import { getPrinters, getGcodes, deleteGcode, printGcode } from '../services/karmen-backend';

const BASE_URL = window.env.BACKEND_BASE;

class GcodeRow extends React.Component {
  state = {
    showDeleteRow: false,
    showPrinterSelectRow: false,
    showPrintStatusRow: false,
    message: '',
    messageOk: false,
    selectedPrinter: null,
    availablePrinters: [],
  }

  // props to https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  render() {
    const { showDeleteRow, showPrinterSelectRow, showPrintStatusRow, availablePrinters, selectedPrinter } = this.state;
    const { display, path, size, uploaded, data, onRowDelete, id } = this.props;
    if (showPrintStatusRow) {
      const { message, messageOk } = this.state;
      return (
        <tr>
          <td colSpan="3">
            {message && <p className={messageOk ? "message-success" : "message-error"}>{message}</p>}
          </td>
          <td className="action-cell">
            <button className="plain" onClick={() => {
              this.setState({
                showPrintStatusRow: false,
              })
            }}><i className="icon icon-cross icon-state-cancel"></i></button>
          </td>
        </tr>
      );
    }
    if (showDeleteRow) {
      return (
        <tr className="inverse">
          <td colSpan="3">
            Do you really want to delete <strong>{path}/{display}</strong>? This cannot be undone.
          </td>
          <td className="action-cell">
            <button className="plain" title="Cancel" onClick={() => {
              this.setState({
                showDeleteRow: false,
              })
            }}><i className="icon icon-cross"></i></button>
            <button className="plain" title="Confirm delete" onClick={() => {
              onRowDelete();
            }}><i className="icon icon-checkmark"></i></button>
          </td>
        </tr>
      );
    }

    if (showPrinterSelectRow) {
      const availablePrinterOpts = availablePrinters.map((p) => {
        return <option key={p.ip} value={p.ip}>{`${p.name} (${p.ip})`}</option>;
      })
      return (
        <tr>
          <td colSpan="3">
            On which printer would you like to print?{' '}
            <select id="selectedPrinter" name="selectedPrinter" value={selectedPrinter} onChange={(e) => this.setState({
              selectedPrinter: e.target.value,
            })}>
            {availablePrinterOpts}
            </select>
          </td>
          <td className="action-cell">
            <button className="plain" onClick={() => {
              this.setState({
                showPrinterSelectRow: false,
                selectedPrinter: null,
              })
            }}><i className="icon icon-cross icon-state-cancel"></i></button>
            <button className="plain" onClick={() => {
              const { selectedPrinter } = this.state;
              printGcode(id, selectedPrinter)
                .then((r) => {
                  switch(r) {
                    case 201:
                      this.setState({
                        showPrinterSelectRow: false,
                        showPrintStatusRow: true,
                        message: 'Print was scheduled',
                        messageOk: true,
                      });
                      break;
                    default:
                      this.setState({
                        showPrinterSelectRow: false,
                        showPrintStatusRow: true,
                        message: 'Print was not scheduled',
                        messageOk: false,
                      });
                  }
                });
            }}><i className="icon icon-checkmark icon-state-confirm"></i></button>
          </td>
        </tr>
      );
    }

    return (
      <tr>
        <td><a href={`${window.env.BACKEND_BASE}${data}`}>{path}/{display}</a></td>
        <td>{this.formatBytes(size)}</td>
        <td>{dayjs(uploaded).format('HH:mm:ss YYYY-MM-DD')}</td>
        <td className="action-cell">
          <button className="plain icon-link" onClick={() => {
            getPrinters().then((printers) => {
              const availablePrinters = printers && printers
                .sort((p, r) => p.name > r.name ? 1 : -1)
                .filter((p) => p.client && p.client.connected);
              this.setState({
                availablePrinters,
                selectedPrinter: availablePrinters.length ? availablePrinters[0].ip : null,
                showPrinterSelectRow: true,
              });
            })
          }}><i className="icon icon-printer"></i></button>
          <button className="plain icon-link" onClick={() => {
            this.setState({
              showDeleteRow: true,
            })
          }}><i className="icon icon-bin"></i></button>
        </td>
      </tr>
    );
  }
}

class GcodeList extends React.Component {
  state = {
    gcodes: null,
    currentPage: 0,
    pages: [{
      nextStartWith: null,
    }],
    orderBy: null,
    message: null
  }

  constructor(props) {
    super(props);
    this.loadPage = this.loadPage.bind(this);
  }

  loadPage(page) {
    let { pages } = this.state;
    getGcodes(pages[page].startWith).then((gcodes) => {
      let nextStartWith;
      if (gcodes.next) {
        const uri = new URL(gcodes.next.indexOf('http') !== 0 ? `${BASE_URL}${gcodes.next}` : gcodes.next)
        nextStartWith = uri.searchParams.get('start_with');
      }
      if (nextStartWith) {
        pages.push({
          startWith: nextStartWith,
        });
      } else {
        pages = [].concat(pages.slice(0, page + 1));
      }
      this.setState({
        gcodes: gcodes.items,
        currentPage: page,
        pages: pages,
      });
    });
  }

  componentDidMount() {
    this.loadPage(0);
  }

  render () {
    const { gcodes, currentPage, pages } = this.state;
    if (gcodes === null) {
      return <div><Loader /></div>;
    }
    const gcodeRows = gcodes && gcodes.sort((p, r) => p.name > r.name ? 1 : -1).map((g) => {
      return <GcodeRow
        key={g.id}
        {...g}
        onRowDelete={() => {
          deleteGcode(g.id)
            .then(() => {
              this.loadPage(currentPage);
            });
        }} />
    });

    return (
      <div className="gcode-list standalone-page">
        <header>
          <h1 className="title">G-Codes</h1>
          <Link to="/add-gcode" className="action">
            <i className="icon icon-plus"></i>&nbsp;
            <span>Add a g-code</span>
          </Link>
        </header>

        <div>
          {(!gcodeRows || gcodeRows.length === 0)
          ? <p className="message-error">No G-Codes found!</p>
          : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Size</th>
                    <th>Uploaded at</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {gcodeRows}
                </tbody>
              </table>
              <div className="table-pagination">
                {currentPage > 0
                  ? <button className="plain" onClick={() => this.loadPage(Math.max(0, currentPage - 1))}>Previous</button>
                  : <span></span>}
                {pages[currentPage + 1]
                  ? <button className="plain" onClick={() => this.loadPage(currentPage + 1)}>Next</button>
                  : <span></span>}
              </div>
            </>
          )}
          </div>
      </div>
    );
  }
}

export default GcodeList;