import React from 'react';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

import Loader from '../components/loader';
import { PrinterView } from '../components/printer-view';
import { PrinterEditForm } from '../components/printer-edit-form';
import { getPrinter, patchPrinter, getPrinterJobs, setPrinterConnection } from '../services/karmen-backend';
import formatters from '../services/formatters';

const BASE_URL = window.env.BACKEND_BASE;

class PrinterConnectionForm extends React.Component {
  state = {
    showConnectionWarningRow: false,
    targetState: null,
    submitting: false,
  }

  constructor(props) {
    super(props);
    this.changePrinterConnection = this.changePrinterConnection.bind(this);
  }

  changePrinterConnection() {
    const { targetState } = this.state;
    const { printer, onPrinterConnectionChanged } = this.props;
    setPrinterConnection(printer.host, targetState)
      .then((r) => {
        if (onPrinterConnectionChanged) {
          onPrinterConnectionChanged(targetState)
            .then(() => {
              this.setState({
                submitting: false,
                showConnectionWarningRow: false,
                targetState: null,
              });
            });
        } else {
          this.setState({
            submitting: false,
            showConnectionWarningRow: false,
            targetState: null,
          });
        }
      });
  }

  render() {
    const { printer } = this.props;
    const { showConnectionWarningRow, submitting } = this.state;
    return (
      <form className="inline-form">
        {showConnectionWarningRow
        ? <div>
            <p className="message-warning">
              Are you sure? This might affect any current printer operation.
              <button className="plain" type="submit" onClick={(e) => {
                e.preventDefault();
                this.setState({
                  submitting: true,
                });
                this.changePrinterConnection();
              }}
              disabled={submitting}>{submitting ? "Working..." : "Yes, please"}</button>
              <button type="reset" onClick={(e) => {
                e.preventDefault();
                this.setState({
                  submitting: false,
                  showConnectionWarningRow: false,
                  targetState: null,
                });
              }} disabled={submitting}>Cancel</button>
            </p>
          </div>
        : <>
            <strong>Printer status</strong>: {printer.status.state}
            {printer.client.access_level === 'unlocked' && <>
              {(["Offline", "Closed"].indexOf(printer.status.state) > -1 || printer.status.state.match(/printer is not connected/i)) &&
                <button className="plain" type="submit" onClick={(e) => {
                  e.preventDefault();
                  this.setState({
                    showConnectionWarningRow: true,
                    targetState: "online",
                  });
                }} disabled={submitting}>Connect</button>
              }
              {(["Offline", "Closed", "Printer is not responding"].indexOf(printer.status.state) === -1) && !printer.status.state.match(/printer is not connected/i) &&
                <button className="plain" type="submit" onClick={(e) => {
                  e.preventDefault();
                  this.setState({
                    showConnectionWarningRow: true,
                    targetState: "offline",
                  });
                }} disabled={submitting}>Disconnect</button>
              }
            </>}
          </>
        }
      </form>
    );
  }
}

class PrinterAuthorizationForm extends React.Component {
  state = {
    apiKey: '',
    submitting: false,
  }

  constructor(props) {
    super(props);
    this.setApiKey = this.setApiKey.bind(this);
  }

  setApiKey() {
    const { apiKey } = this.state;
    if (!apiKey) {
      this.setState({
        submitting: false,
      });
    }
    const { printer, onPrinterAuthorizationChanged } = this.props;
    patchPrinter(printer.host, {
      api_key: apiKey
    })
      .then((r) => {
        if (onPrinterAuthorizationChanged) {
          onPrinterAuthorizationChanged(apiKey)
            .then(() => {
              this.setState({
                submitting: false,
                apiKey: '',
              });
            });
        } else {
          this.setState({
            submitting: false,
            apiKey: '',
          });
        }
      });
  }

  render() {
    const { printer } = this.props;
    const { submitting, apiKey } = this.state;
    const getAccessLevelString = (level) => {
      switch (level) {
        case 'read_only':
          return 'Read only, unlock with API key';
        case 'protected':
          return 'Authorization required, unlock with a valid API key';
        case 'unlocked':
          return 'Full access';
        case 'unknown':
        default:
          return 'Unknown';
      }
    }
    return (
      <form className="inline-form">
        <strong>Client availability</strong>:{' '}
          <span>{getAccessLevelString(printer.client.access_level)}</span>
          {['unlocked', 'unknown'].indexOf(printer.client.access_level) === -1 &&
            <>
              <input type="text" id={apiKey} name={apiKey} value={apiKey || printer.client.api_key || ''} onChange={(e) => {
                this.setState({
                  apiKey: e.target.value,
                });
              }} />
              <button className="plain" type="submit" onClick={(e) => {
                  e.preventDefault();
                  this.setState({
                    submitting: true,
                  });
                  this.setApiKey();
                }}
                disabled={submitting || (!apiKey && !printer.client.api_key)}>{submitting ? "Working..." : "Set"}</button>
            </>
          }
      </form>
    );
  }
}

const PrinterConnectionStatus = ({ printer, onPrinterStateChanged }) => {
  return (
    <div className="printer-connection">
      <h2 className="hidden">Connection</h2>
      <ul>
          <li><strong>Client status</strong>: {printer.client.connected ? 'Connected' : 'Disconnected'}</li>
          <li><strong>Client</strong>: {printer.client.name} (<code>{JSON.stringify(printer.client.version)}</code>)</li>
          <li><strong>Client host</strong>: <a href={`${printer.protocol}://${printer.host}`} target="_blank" rel="noopener noreferrer">{printer.host}</a></li>
          {printer.hostname && <li><strong>Hostname</strong>: <a href={`${printer.protocol}://${printer.hostname}`} target="_blank" rel="noopener noreferrer">{printer.hostname}</a></li>}
          <li>
            <PrinterConnectionForm
              printer={printer}
              onPrinterConnectionChanged={onPrinterStateChanged}
            />
          </li>
          <li>
            <PrinterAuthorizationForm
              printer={printer}
              onPrinterAuthorizationChanged={onPrinterStateChanged}
            />
          </li>
      </ul>
    </div>
  );
}

class PrintJobRow extends React.Component {
  render() {
    const { gcode_data, started } = this.props;
    if (!gcode_data) {
      return (<tr></tr>);
    }
    return (
      <tr>
        <td>
          {gcode_data && gcode_data.available
            ? (<Link to={`/gcodes/${gcode_data.id}`}>{gcode_data.filename}</Link>)
            : (<span>{gcode_data.filename}</span>)
          }
        </td>
        <td>{formatters.bytes(gcode_data.size)}</td>
        <td>{dayjs(started).format('HH:mm:ss YYYY-MM-DD')}</td>
      </tr>
    );
  }
}

class PrinterDetail extends React.Component {
  state = {
    printer: null,
    jobs: [],
    jobsTable: {
      currentPage: 0,
      pages: [{
        startWith: null,
      }],
      orderBy: '-started',
    }
  }

  constructor(props) {
    super(props);
    this.loadPrinter = this.loadPrinter.bind(this);
    this.loadJobsPage = this.loadJobsPage.bind(this);
    this.changePrinter = this.changePrinter.bind(this);
  }

  loadPrinter() {
    const { match } = this.props;
    return getPrinter(match.params.host, ['job', 'status', 'webcam']).then((printer) => {
      this.setState({
        printer,
      });
    });
  }

  loadJobsPage(page, newOrderBy) {
    const { match } = this.props;
    const { jobsTable } = this.state;
    // reset pages if orderBy has changed
    if (newOrderBy !== jobsTable.orderBy) {
      jobsTable.pages = [{
        startWith: null,
      }];
      page = 0;
    }
    return getPrinterJobs(jobsTable.pages[page].startWith, newOrderBy, match.params.host).then((jobs) => {
      if (!jobs.next && jobs.items.length === 0 && page - 1 >= 0) {
        this.loadJobsPage(page - 1, newOrderBy);
        return;
      }
      let nextStartWith;
      if (jobs.next) {
        const uri = new URL(jobs.next.indexOf('http') !== 0 ? `${BASE_URL}${jobs.next}` : jobs.next)
        nextStartWith = uri.searchParams.get('start_with');
      }
      if (nextStartWith) {
        jobsTable.pages.push({
          startWith: nextStartWith,
        });
      } else {
        jobsTable.pages = [].concat(jobsTable.pages.slice(0, page + 1));
      }

      this.setState({
        jobs: jobs.items,
        jobsTable: Object.assign({}, jobsTable, {
          currentPage: page,
          orderBy: newOrderBy,
        })
      });
    });
  }

  changePrinter(newParameters) {
    const { printer } = this.state;
    return patchPrinter(printer.host, newParameters)
      .then((r) => {
        switch(r) {
          case 204:
            this.setState({
              printer: Object.assign({}, printer, newParameters),
            });
            return {
              ok: true,
              message: 'Changes saved successfully'
            };
          case 400:
          default:
            return {
              ok: false,
              message: 'Cannot save your changes, check server logs',
            };
        }
      });
  }

  componentDidMount() {
    const { jobsTable } = this.state
    this.loadPrinter();
    this.loadJobsPage(0, jobsTable.orderBy);
  }

  render () {
    const { printer, jobs, jobsTable } = this.state;
    if (!printer) {
      return <div><Loader /></div>;
    }
    const jobsRows = jobs && jobs.map((j) => {
      return <PrintJobRow
        key={j.id}
        {...j}
        />
    });
    return (
      <div className="printer-detail standalone-page">
        <header>
          <h1 className="title">
            {printer.name}
          </h1>
        </header>
        <div>
          <div className="printer-info">
            <div >
              <PrinterConnectionStatus
                printer={printer}
                onPrinterStateChanged={() => {
                  return new Promise((resolve, reject) => {
                    // TODO this is naive, it should wait for an actual state change
                    setTimeout(() => {
                      this.loadPrinter()
                        .then(() => resolve(true))
                    }, 3000);
                  })
                }}
              />
              <div>
                <h2 className="hidden">Change printer properties</h2>
                <PrinterEditForm
                  defaults={{
                    name: printer.name,
                    filament_type: (printer.printer_props && printer.printer_props.filament_type) || '',
                    filament_color: (printer.printer_props && printer.printer_props.filament_color) || '',
                    bed_type: (printer.printer_props && printer.printer_props.bed_type) || '',
                    tool0_diameter: (printer.printer_props && printer.printer_props.tool0_diameter) || '',
                  }}
                  onSubmit={this.changePrinter}
                  onCancel={() => {
                    this.props.history.push('/');
                  }}
                />
              </div>
              <div>
                {(!jobsRows || jobsRows.length === 0)
                  ? <></>
                  : (
                    <>
                      <h2>Printing history</h2>
                      <table>
                        <thead>
                          <tr>
                            <th style={{"width": "50%"}}>Filename</th>
                            <th>Size</th>
                            <th>
                              <button className={`plain sorting-button ${jobsTable.orderBy.indexOf('started') > -1 ? 'active' : ''}`} onClick={() => {
                                let order = '+started';
                                if (jobsTable.orderBy === '+started') {
                                  order = '-started';
                                }
                                this.loadJobsPage(jobsTable.currentPage, order);
                              }}>Started</button>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {jobsRows}
                        </tbody>
                      </table>
                      <div className="table-pagination">
                        {jobsTable.currentPage > 0
                          ? <button className="plain" onClick={() => this.loadJobsPage(Math.max(0, jobsTable.currentPage - 1), jobsTable.orderBy)}>Previous</button>
                          : <span></span>}
                        {jobsTable.pages[jobsTable.currentPage + 1]
                          ? <button className="plain" onClick={() => this.loadJobsPage(jobsTable.currentPage + 1, jobsTable.orderBy)}>Next</button>
                          : <span></span>}
                      </div>
                    </>
                  )}
              </div>
            </div>
            <div className="content-box">
              <PrinterView
                printer={printer}
                hideActions={true}
                onCurrentJobStateChange={this.loadPrinter}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default PrinterDetail;