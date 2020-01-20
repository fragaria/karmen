import React from "react";
import { connect } from "react-redux";
import { Link, Redirect } from "react-router-dom";

import Loader from "../components/loader";
import RoleBasedGateway from "../components/role-based-gateway";
import TableSorting from "../components/table-sorting";
import Progress from "../components/progress";
import { WebcamStream } from "../components/webcam-stream";
import formatters from "../services/formatters";

import { getPrinterJobs } from "../services/backend";
import {
  loadPrinter,
  patchPrinter,
  setPrinterConnection
} from "../actions/printers";

class PrinterConnectionForm extends React.Component {
  state = {
    showConnectionWarningRow: false,
    targetState: null,
    submitting: false
  };

  constructor(props) {
    super(props);
    this.changePrinterConnection = this.changePrinterConnection.bind(this);
  }

  changePrinterConnection() {
    const { targetState } = this.state;
    const { printer, onPrinterConnectionChanged } = this.props;
    onPrinterConnectionChanged(printer.host, targetState).then(r => {
      this.setState({
        submitting: false,
        showConnectionWarningRow: false,
        targetState: null
      });
    });
  }

  render() {
    const { printer } = this.props;
    const { showConnectionWarningRow, submitting } = this.state;
    return (
      <form className="inline-form">
        {showConnectionWarningRow ? (
          <div>
            <p className="message-warning">
              Are you sure? This might affect any current printer operation.
            </p>
            <button
              className="btn btn-sm"
              type="submit"
              onClick={e => {
                e.preventDefault();
                this.setState({
                  submitting: true
                });
                this.changePrinterConnection();
              }}
              disabled={submitting}
            >
              {submitting ? "Working..." : "Yes, please"}
            </button>{" "}
            <button
              type="reset"
              className={submitting ? "hidden" : "btn btn-sm btn-secondary"}
              onClick={e => {
                e.preventDefault();
                this.setState({
                  submitting: false,
                  showConnectionWarningRow: false,
                  targetState: null
                });
              }}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        ) : (
          <dd className="description">
            {printer.status.state}{" "}
            {printer.client.access_level === "unlocked" && (
              <>
                {(["Offline", "Closed"].indexOf(printer.status.state) > -1 ||
                  printer.status.state.match(/printer is not connected/i)) && (
                  <button
                    className="btn btn-sm"
                    type="submit"
                    onClick={e => {
                      e.preventDefault();
                      this.setState({
                        showConnectionWarningRow: true,
                        targetState: "online"
                      });
                    }}
                    disabled={submitting}
                  >
                    Connect
                  </button>
                )}
                {["Offline", "Closed", "Printer is not responding"].indexOf(
                  printer.status.state
                ) === -1 &&
                  !printer.status.state.match(/printer is not connected/i) && (
                    <button
                      className="btn-reset anchor"
                      type="submit"
                      onClick={e => {
                        e.preventDefault();
                        this.setState({
                          showConnectionWarningRow: true,
                          targetState: "offline"
                        });
                      }}
                      disabled={submitting}
                    >
                      Disconnect
                    </button>
                  )}
              </>
            )}
          </dd>
        )}
      </form>
    );
  }
}

class PrinterAuthorizationForm extends React.Component {
  state = {
    apiKey: "",
    submitting: false
  };

  constructor(props) {
    super(props);
    this.setApiKey = this.setApiKey.bind(this);
  }

  setApiKey(e) {
    e.preventDefault();
    this.setState({
      submitting: true
    });
    const { apiKey } = this.state;
    const { onPrinterAuthorizationChanged } = this.props;
    return onPrinterAuthorizationChanged({
      api_key: apiKey
    }).then(r => {
      this.setState({
        submitting: false,
        apiKey: ""
      });
    });
  }

  render() {
    const { printer } = this.props;
    const { submitting, apiKey } = this.state;
    const getAccessLevelString = level => {
      switch (level) {
        case "read_only":
          return "Read only, unlock with API key";
        case "protected":
          return "Authorization required, unlock with a valid API key";
        case "unlocked":
          return "Full access";
        case "unknown":
        default:
          return "Unknown";
      }
    };
    return (
      <form className="inline-form">
        <dd className="description">
          {getAccessLevelString(printer.client.access_level)}
        </dd>
        {["unlocked", "unknown"].indexOf(printer.client.access_level) ===
          -1 && (
          <>
            <input
              type="text"
              id={apiKey}
              name={apiKey}
              value={apiKey || printer.client.api_key || ""}
              onChange={e => {
                this.setState({
                  apiKey: e.target.value
                });
              }}
            />
            <button
              className="btn btn-sm"
              type="submit"
              onClick={this.setApiKey}
              disabled={submitting || (!apiKey && !printer.client.api_key)}
            >
              {submitting ? "Working..." : "Set"}
            </button>
          </>
        )}
      </form>
    );
  }
}

const PrinterConnectionStatus = ({
  printer,
  onPrinterConnectionChanged,
  onPrinterAuthorizationChanged
}) => {
  const props = printer.printer_props;

  return (
    <div className="printer-connection">
      <h2 className="hidden">Connection</h2>
      <dl className="dl-horizontal">
        <dt className="term">Client status: </dt>
        <dd className="description">
          {printer.client.connected ? "Connected" : "Disconnected"}
        </dd>

        <dt className="term">Client: </dt>
        <dd className="description">
          {printer.client.name} (
          <code>{JSON.stringify(printer.client.version)}</code>)
        </dd>

        <dt className="term">Client host: </dt>
        <dd className="decription">
          <a
            className="anchor"
            href={`${printer.protocol}://${printer.host}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {printer.host}
          </a>
        </dd>

        {printer.hostname && (
          <>
            <dt className="term">Hostname: </dt>
            <dd className="decription">
              <a
                className="anchor"
                href={`${printer.protocol}://${printer.hostname}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {printer.hostname}
              </a>
            </dd>
          </>
        )}

        <dt className="term">Printer status: </dt>
        <PrinterConnectionForm
          printer={printer}
          onPrinterConnectionChanged={onPrinterConnectionChanged}
        />

        <dt className="term">Client availability: </dt>
        <PrinterAuthorizationForm
          printer={printer}
          onPrinterAuthorizationChanged={onPrinterAuthorizationChanged}
        />

        {props &&
          (props.filament_type ||
            props.filament_color ||
            props.bed_type ||
            props.tool0_diameter) && (
            <>
              <dt className="term">Setup:</dt>
              <dd className="description">{props.filament_type}</dd>

              {props.filament_color && (
                <>
                  <dt className="term">Filament color:</dt>
                  <dd className="description">{props.filament_color}</dd>
                </>
              )}

              {props.bed_type && (
                <>
                  <dt className="term">Bed type:</dt>
                  <dd className="description">{props.bed_type}</dd>
                </>
              )}

              {props.tool0_diameter && (
                <>
                  <dt className="term">Nozzle:</dt>
                  <dd className="description">{props.tool0_diameter} mm</dd>
                </>
              )}
            </>
          )}
      </dl>
    </div>
  );
};

class PrintJobRow extends React.Component {
  render() {
    const { gcode_data, started, username } = this.props;
    if (!gcode_data) {
      return <div className="list-item"></div>;
    }
    return (
      <div className="list-item">
        <div className="list-item-content">
          {gcode_data && gcode_data.available ? (
            <Link
              className="list-item-subtitle"
              to={`/gcodes/${gcode_data.id}`}
            >
              {gcode_data.filename}
            </Link>
          ) : (
            <span className="list-item-subtitle">{gcode_data.filename}</span>
          )}

          <small>
            {formatters.bytes(gcode_data.size)}
            {", "}
            {formatters.datetime(started)}
            {", "}
            {username}
          </small>
        </div>
      </div>
    );
  }
}

class PrinterDetail extends React.Component {
  state = {
    printerLoaded: false,
    jobs: [],
    jobsTable: {
      currentPage: 0,
      pages: [
        {
          startWith: null
        }
      ],
      orderBy: "-started"
    }
  };

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
      jobsTable.pages = [
        {
          startWith: null
        }
      ];
      page = 0;
    }
    return getPrinterJobs(
      jobsTable.pages[page].startWith,
      newOrderBy,
      match.params.host
    ).then(jobs => {
      if (!jobs.next && jobs.items.length === 0 && page - 1 >= 0) {
        this.loadJobsPage(page - 1, newOrderBy);
        return;
      }
      let nextStartWith;
      if (jobs.next) {
        const uri = new URL(formatters.absoluteUrl(jobs.next));
        nextStartWith = uri.searchParams.get("start_with");
      }
      if (nextStartWith) {
        jobsTable.pages.push({
          startWith: nextStartWith
        });
      } else {
        jobsTable.pages = [].concat(jobsTable.pages.slice(0, page + 1));
      }

      this.setState({
        jobs: jobs.items,
        jobsTable: Object.assign({}, jobsTable, {
          currentPage: page,
          orderBy: newOrderBy
        })
      });
    });
  }

  changePrinter(newParameters) {
    const { match, patchPrinter } = this.props;
    return patchPrinter(match.params.host, newParameters).then(r => {
      switch (r.status) {
        case 200:
          return {
            ok: true,
            message: "Changes saved successfully"
          };
        default:
          return {
            ok: false,
            message: "Cannot save your changes, check server logs"
          };
      }
    });
  }

  componentDidMount() {
    const { jobsTable } = this.state;
    const { match, loadPrinter, getPrinter } = this.props;
    if (!getPrinter(match.params.host)) {
      loadPrinter(match.params.host).then(() => {
        this.setState({
          printerLoaded: true
        });
      });
    } else {
      this.setState({
        printerLoaded: true
      });
    }
    // TODO drop this in favour of redux
    this.loadJobsPage(0, jobsTable.orderBy);
  }

  render() {
    const { printerLoaded, jobs, jobsTable } = this.state;
    const { getPrinter, match, setPrinterConnection } = this.props;
    const printer = getPrinter(match.params.host);
    if (!printerLoaded) {
      return (
        <div>
          <Loader />
        </div>
      );
    }
    if (!printer) {
      return <Redirect to="/page-404" />;
    }
    const jobsRows =
      jobs &&
      jobs.map(j => {
        return <PrintJobRow key={j.id} {...j} />;
      });
    return (
      <RoleBasedGateway requiredRole="admin">
        <section className="content">
          <div className="printer-detail">
            <div className="printer-detail-stream">
              <WebcamStream {...printer.webcam} />
              <Progress {...printer.job} />
            </div>

            <div className="printer-detail-meta">
              <div className="container">
                <h1 className="main-title">{printer.name}</h1>
                <PrinterConnectionStatus
                  printer={printer}
                  onPrinterAuthorizationChanged={this.changePrinter}
                  onPrinterConnectionChanged={setPrinterConnection}
                />
              </div>
            </div>

            <div className="printer-detail-jobs">
              {!jobsRows || jobsRows.length === 0 ? (
                <></>
              ) : (
                <>
                  <ul className="tabs-navigation">
                    <li className="tab active">
                      <h2>Jobs</h2>
                    </li>
                  </ul>

                  <div className="tabs-content">
                    <TableSorting
                      active={jobsTable.orderBy}
                      collection={["started"]}
                      onChange={() => {
                        let order = "+started";
                        if (jobsTable.orderBy === "+started") {
                          order = "-started";
                        }
                        this.loadJobsPage(jobsTable.currentPage, order);
                      }}
                    />

                    <div className="list">{jobsRows}</div>
                  </div>

                  <div className="table-pagination">
                    {jobsTable.currentPage > 0 ? (
                      <button
                        className="btn btn-sm"
                        onClick={() =>
                          this.loadJobsPage(
                            Math.max(0, jobsTable.currentPage - 1),
                            jobsTable.orderBy
                          )
                        }
                      >
                        Previous
                      </button>
                    ) : (
                      <span></span>
                    )}
                    {jobsTable.pages[jobsTable.currentPage + 1] ? (
                      <button
                        className="btn btn-sm"
                        onClick={() =>
                          this.loadJobsPage(
                            jobsTable.currentPage + 1,
                            jobsTable.orderBy
                          )
                        }
                      >
                        Next
                      </button>
                    ) : (
                      <span></span>
                    )}
                  </div>
                </>
              )}
              <div className="cta-box text-center">
                <Link to={`/printers/${printer.host}/settings`}>
                  <button className="btn">Printer settings</button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </RoleBasedGateway>
    );
  }
}

export default connect(
  state => ({
    getPrinter: host => state.printers.printers.find(p => p.host === host)
  }),
  dispatch => ({
    loadPrinter: host =>
      dispatch(loadPrinter(host, ["job", "status", "webcam"])),
    patchPrinter: (host, data) => dispatch(patchPrinter(host, data)),
    setPrinterConnection: (host, state) =>
      dispatch(setPrinterConnection(host, state))
  })
)(PrinterDetail);
