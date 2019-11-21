import React from 'react';
import dayjs from 'dayjs';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import Loader from '../components/loader';
import { PrinterView } from '../components/printer-view';
import { PrinterEditForm } from '../components/printer-edit-form';
import RoleBasedGateway from '../components/role-based-gateway';
import formatters from '../services/formatters';

import { getPrinterJobs } from '../services/backend';
import { loadPrinter, patchPrinter, setPrinterConnection, changeCurrentJob } from '../actions/printers';

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
    onPrinterConnectionChanged(printer.host, targetState)
      .then((r) => {
        this.setState({
          submitting: false,
          showConnectionWarningRow: false,
          targetState: null,
        });
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
              <button type="reset" className={submitting ? "hidden" : ""} onClick={(e) => {
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

  setApiKey(e) {
    e.preventDefault()
    this.setState({
      submitting: true,
    });
    const { apiKey } = this.state;
    const { onPrinterAuthorizationChanged } = this.props;
    return onPrinterAuthorizationChanged({
      api_key: apiKey
    }).then((r) => {
        this.setState({
          submitting: false,
          apiKey: '',
        });
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
              <button
                className="plain"
                type="submit"
                onClick={this.setApiKey}
                disabled={submitting || (!apiKey && !printer.client.api_key)}
                >{submitting ? "Working..." : "Set"}</button>
            </>
          }
      </form>
    );
  }
}

const PrinterConnectionStatus = ({ printer, onPrinterConnectionChanged, onPrinterAuthorizationChanged }) => {
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
              onPrinterConnectionChanged={onPrinterConnectionChanged}
            />
          </li>
          <li>
            <PrinterAuthorizationForm
              printer={printer}
              onPrinterAuthorizationChanged={onPrinterAuthorizationChanged}
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
    printerLoaded: false,
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
    this.loadJobsPage = this.loadJobsPage.bind(this);
    this.changePrinter = this.changePrinter.bind(this);
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
    const { match, patchPrinter } = this.props;
    return patchPrinter(match.params.host, newParameters)
      .then((r) => {
        switch(r.status) {
          case 200:
            return {
              ok: true,
              message: 'Changes saved successfully'
            };
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
    const { match, loadPrinter, getPrinter } = this.props;
    if (!getPrinter(match.params.host)) {
      loadPrinter(match.params.host)
        .then(() => {
          this.setState({
            printerLoaded: true,
          });
        });
    } else {
      this.setState({
        printerLoaded: true,
      });
    }
    // TODO drop this in favour of redux
    this.loadJobsPage(0, jobsTable.orderBy);
  }

  render () {
    const { printerLoaded, jobs, jobsTable } = this.state;
    const { getPrinter, match, setPrinterConnection, changeCurrentJobState } = this.props;
    const printer = getPrinter(match.params.host);
    if (!printerLoaded) {
      return <div><Loader /></div>;
    }
    const jobsRows = jobs && jobs.map((j) => {
      return <PrintJobRow
        key={j.id}
        {...j}
        />
    });
    return (
      <RoleBasedGateway requiredRole="admin">
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
                  onPrinterAuthorizationChanged={this.changePrinter}
                  onPrinterConnectionChanged={setPrinterConnection}
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
                  showActions={false}
                  changeCurrentJobState={changeCurrentJobState}
                />
              </div>
            </div>
          </div>
        </div>
      </RoleBasedGateway>
    );
  }
}

export default connect(
  state => ({
    getPrinter: (host) => state.printers.printers.find((p) => p.host === host),
  }),
  dispatch => ({
    loadPrinter: (host) => (dispatch(loadPrinter(host, ['job', 'status', 'webcam']))),
    patchPrinter: (host, data) => (dispatch(patchPrinter(host, data))),
    setPrinterConnection: (host, state) => (dispatch(setPrinterConnection(host, state))),
    changeCurrentJobState: (host, action) => (dispatch(changeCurrentJob(host, action))),
  })
)(PrinterDetail);
