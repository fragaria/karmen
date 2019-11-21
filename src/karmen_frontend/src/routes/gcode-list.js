import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import Loader from '../components/loader';
import { getGcodes, deleteGcode, printGcode } from '../services/backend';
import { loadPrinters } from '../actions/printers';
import formatters from '../services/formatters';

const BASE_URL = window.env.BACKEND_BASE;

class GcodeRow extends React.Component {
  state = {
    showDeleteRow: false,
    showPrinterSelectRow: false,
    showPrintStatusRow: false,
    canCancelPrintStatusRow: true,
    message: '',
    messageOk: false,
    selectedPrinter: null,
    availablePrinters: [],
    showFilamentTypeWarningRow: false,
    printerFilamentType: '',
    gcodeFilamentType: '',
  }

  constructor (props) {
    super(props);
    this.schedulePrint = this.schedulePrint.bind(this);
  }

  schedulePrint(gcodeId, printerHost) {
    const { onSchedulePrint } = this.props;
    printGcode(gcodeId, printerHost)
      .then((r) => {
        switch(r) {
          case 201:
            this.setState({
              showPrinterSelectRow: false,
              canCancelPrintStatusRow: true,
              showPrintStatusRow: true,
              message: 'Print was scheduled',
              messageOk: true,
            });
            onSchedulePrint && onSchedulePrint(gcodeId, printerHost);
            break;
          default:
            this.setState({
              showPrinterSelectRow: false,
              canCancelPrintStatusRow: true,
              showPrintStatusRow: true,
              message: 'Print was not scheduled',
              messageOk: false,
            });
        }
      });
  }

  render() {
    const { showDeleteRow, showPrinterSelectRow, canCancelPrintStatusRow, showPrintStatusRow,
      showFilamentTypeWarningRow, selectedPrinter} = this.state;
    const { display, path, size, uploaded, onRowDelete, id, username, analysis, availablePrinters } = this.props;
    if (showPrintStatusRow) {
      const { message, messageOk } = this.state;
      return (
        <tr>
          <td colSpan="4">
            {message && <p className={messageOk ? "message-success" : "message-error"}>{message}</p>}
          </td>
          <td className="action-cell">
            {canCancelPrintStatusRow && <button className="plain" onClick={() => {
              this.setState({
                showPrintStatusRow: false,
              })
            }}><i className="icon icon-cross icon-state-cancel"></i></button>}
          </td>
        </tr>
      );
    }
    if (showDeleteRow) {
      return (
        <tr className="inverse">
          <td colSpan="4">
            Do you really want to delete <strong>{path}{path ? '/' : ''}{display}</strong>? This cannot be undone.
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

    if (showFilamentTypeWarningRow) {
      const {printerFilamentType, gcodeFilamentType } = this.state;
      return (
        <tr>
          <td colSpan="4">
            Are you sure? There seems to be a filament mismatch: Printer has <strong>{printerFilamentType}</strong> configured, but this gcode was sliced for <strong>{gcodeFilamentType}</strong>.
          </td>
          <td className="action-cell">
            <button className="plain" title="Cancel" onClick={() => {
              this.setState({
                showFilamentTypeWarningRow: false,
              })
            }}><i className="icon icon-cross icon-state-cancel"></i></button>
            <button className="plain" title="Print" onClick={() => {
              const { selectedPrinter } = this.state;
              this.setState({
                  showPrinterSelectRow: false,
                  canCancelPrintStatusRow: false,
                  showFilamentTypeWarningRow: false,
                  showPrintStatusRow: true,
                  message: 'Scheduling a print',
                  messageOk: true,
                });
              this.schedulePrint(id, selectedPrinter);
            }}><i className="icon icon-checkmark icon-state-confirm"></i></button>
          </td>
        </tr>
      );
    }

    if (showPrinterSelectRow) {
      const availablePrinterOpts = availablePrinters.map((p) => {
        return <option key={p.host} value={p.host}>{`${p.name} (${p.host})`}</option>;
      })
      return (
        <tr>
          <td colSpan="4">
          {!!availablePrinters.length
            ? <>On which printer would you like to print?{' '}
            <select id="selectedPrinter" name="selectedPrinter" value={selectedPrinter} onChange={(e) => this.setState({
              selectedPrinter: e.target.value,
            })}>
              {availablePrinterOpts}
            </select>
            </>
            : <p>No available printers found.</p>
          }
          </td>
          <td className="action-cell">
            <button className="plain" onClick={() => {
              this.setState({
                showPrinterSelectRow: false,
                selectedPrinter: null,
              })
            }}><i className="icon icon-cross icon-state-cancel"></i></button>
            {!!availablePrinters.length &&
              <button className="plain" onClick={(e) => {
                e.preventDefault();
                const { selectedPrinter } = this.state;
                const selected = availablePrinters.find((p) => p.host === selectedPrinter);
                if (selected && selected.printer_props && selected.printer_props.filament_type &&
                    analysis && analysis.filament && analysis.filament.type &&
                    analysis.filament.type !== selected.printer_props.filament_type
                  ) {
                  this.setState({
                    showPrinterSelectRow: false,
                    showFilamentTypeWarningRow: true,
                    printerFilamentType: selected.printer_props.filament_type,
                    gcodeFilamentType: analysis.filament.type,
                  });
                  return;
                }
                this.setState({
                  showPrinterSelectRow: false,
                  canCancelPrintStatusRow: false,
                  showFilamentTypeWarningRow: false,
                  showPrintStatusRow: true,
                  message: 'Scheduling a print',
                  messageOk: true,
                });
                this.schedulePrint(id, selectedPrinter);
              }}><i className="icon icon-checkmark icon-state-confirm"></i></button>
            }
          </td>
        </tr>
      );
    }

    return (
      <tr>
        <td><Link to={`/gcodes/${id}`}>{path}{path ? '/' : ''}{display}</Link></td>
        <td>{formatters.bytes(size)}</td>
        <td>{formatters.datetime(uploaded)}</td>
        <td>{username}</td>
        <td className="action-cell">
          <button className="plain icon-link" onClick={() => {
            this.setState({
              selectedPrinter: availablePrinters.length ? availablePrinters[0].host : null,
              showPrinterSelectRow: true,
            });
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
      startWith: null,
    }],
    orderBy: '-uploaded',
    filter: '',
    willBeFilter: '',
    message: null,
    printedOn: [],
  }

  constructor(props) {
    super(props);
    this.loadPage = this.loadPage.bind(this);
  }

  loadPage(page, newOrderBy, newFilter) {
    let { pages, orderBy, filter } = this.state;
    // reset pages if orderBy has changed
    if (newOrderBy !== orderBy || newFilter !== filter) {
      pages = [{
        startWith: null,
      }];
      page = 0;
    }
    getGcodes(pages[page].startWith, newOrderBy, newFilter, 15, ['id', 'display', 'filename', 'path', 'size', 'uploaded', 'analysis', 'user_uuid', 'username']).then((gcodes) => {
      // Handles deleting of the last row on a non-zero page
      if (!gcodes.next && gcodes.items.length === 0 && page - 1 >= 0) {
        this.loadPage(page - 1, newOrderBy);
        return;
      }
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
        orderBy: newOrderBy,
        filter: newFilter,
      });
    });
  }

  componentDidMount() {
    const { printersLoaded, loadPrinters } = this.props
    if (!printersLoaded) {
      loadPrinters();
    }
    const { orderBy } = this.state;
    this.loadPage(0, orderBy);
  }

  render () {
    const { gcodes, currentPage, pages, orderBy, filter, willBeFilter, printedOn } = this.state;
    const { getAvailablePrinters } = this.props;
    if (gcodes === null) {
      return <div><Loader /></div>;
    }
    const gcodeRows = gcodes && gcodes.map((g) => {
      return <GcodeRow
        key={g.id}
        {...g}
        history={this.props.history}
        onSchedulePrint={(gcode, printer) => {
          printedOn.push(printer);
          this.setState({
            printedOn: [].concat(printedOn),
          })
        }}
        availablePrinters={getAvailablePrinters(printedOn)}
        onRowDelete={() => {
          deleteGcode(g.id)
            .then(() => {
              this.loadPage(currentPage, orderBy);
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
          <form className="inline-form">
            <label htmlFor="filter">Filter by filename</label>
            <input type="text" name="filter" id="filter" value={willBeFilter} onChange={(e) => {
              this.setState({
                willBeFilter: e.target.value,
              });
            }} />
            <button type="submit" onClick={(e) => {
              e.preventDefault();
              const { willBeFilter } = this.state;
              this.loadPage(currentPage, orderBy, willBeFilter);
            }}>Filter</button>
            <button type="reset" onClick={(e) => {
              e.preventDefault();
              this.setState({
                willBeFilter: ''
              })
              this.loadPage(currentPage, orderBy, null);
            }}>Reset</button>
          </form>
          {(!gcodeRows || gcodeRows.length === 0)
          ? <p className="message-error message-block">No G-Codes found!</p>
          : (
            <>
              <table>
                <thead>
                  <tr>
                    <th style={{"width": "50%"}}>
                      <button className={`plain sorting-button ${orderBy.indexOf('filename') > -1 ? 'active' : ''}`} onClick={() => {
                        let order = '+filename';
                        if (orderBy === '+filename') {
                          order = '-filename';
                        } else if (orderBy === '-filename') {
                          order = '-uploaded';
                        }
                        this.loadPage(currentPage, order, filter);
                      }}>Filename</button>
                    </th>
                    <th>
                      <button className={`plain sorting-button ${orderBy.indexOf('size') > -1 ? 'active' : ''}`} onClick={() => {
                        let order = '+size';
                        if (orderBy === '+size') {
                          order = '-size';
                        } else if (orderBy === '-size') {
                          order = '-uploaded';
                        }
                        this.loadPage(currentPage, order, filter);
                      }}>Size</button>
                    </th>
                    <th>
                      <button className={`plain sorting-button ${orderBy.indexOf('uploaded') > -1 ? 'active' : ''}`} onClick={() => {
                        let order = '+uploaded';
                        if (orderBy === '+uploaded') {
                          order = '-uploaded';
                        }
                        this.loadPage(currentPage, order, filter);
                      }}>Uploaded at</button>
                    </th>
                    <th>User</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {gcodeRows}
                </tbody>
              </table>
              <div className="table-pagination">
                {currentPage > 0
                  ? <button className="plain" onClick={() => this.loadPage(Math.max(0, currentPage - 1), orderBy, filter)}>Previous</button>
                  : <span></span>}
                {pages[currentPage + 1]
                  ? <button className="plain" onClick={() => this.loadPage(currentPage + 1, orderBy, filter)}>Next</button>
                  : <span></span>}
              </div>
            </>
          )}
          </div>
      </div>
    );
  }
}

export default connect(
  state => ({
    printersLoaded: state.printers.printersLoaded,
    getAvailablePrinters: (without=[]) => state.printers.printers
        .filter((p) => p.status && p.status.state === 'Operational')
        .filter((p) => p.client && p.client.connected)
        .filter((p) => p.client && p.client.access_level === 'unlocked')
        .filter((p) => without.indexOf(p.host) === -1)
  }),
  dispatch => ({
    loadPrinters: () => (dispatch(loadPrinters(['status']))),
  })
)(GcodeList);