import React from "react";
import { connect } from "react-redux";
import { Link, Redirect } from "react-router-dom";

import Loader from "../components/loader";
import TableWrapper from "../components/table-wrapper";
import Progress from "../components/progress";
import { WebcamStream } from "../components/webcam-stream";
import formatters from "../services/formatters";

import { getJobsPage, clearJobsPages } from "../actions/printjobs";
import {
  loadPrinter,
  patchPrinter,
  setPrinterConnection,
  changeCurrentJob
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
    const { onPrinterConnectionChanged } = this.props;
    onPrinterConnectionChanged(targetState).then(r => {
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

class PrinterCurrentPrintControl extends React.Component {
  state = {
    showCancelWarning: false
  };
  render() {
    const { showCancelWarning } = this.state;
    const { printer, onCurrentJobStateChange } = this.props;
    if (
      !printer.status ||
      ["Printing", "Paused"].indexOf(printer.status.state) === -1 ||
      printer.client.access_level !== "unlocked"
    ) {
      return <></>;
    }
    if (showCancelWarning) {
      return (
        <div className="cta-box text-center">
          <p className="message-warning">
            Are you sure? You are about to cancel the whole print!
          </p>
          <button
            className="btn"
            onClick={() => {
              onCurrentJobStateChange("cancel").then(() => {
                this.setState({
                  showCancelWarning: false
                });
              });
            }}
          >
            Cancel the print!
          </button>
        </div>
      );
    }

    return (
      <div className="cta-box text-center">
        {printer.status.state === "Paused" ? (
          <button
            className="btn"
            onClick={() => {
              onCurrentJobStateChange("resume");
            }}
          >
            Resume print
          </button>
        ) : (
          <button
            className="btn"
            onClick={() => {
              onCurrentJobStateChange("pause");
            }}
          >
            Pause print
          </button>
        )}
        <button
          className="btn"
          onClick={() => {
            this.setState({
              showCancelWarning: true
            });
          }}
        >
          Cancel print
        </button>
      </div>
    );
  }
}

const PrinterStatus = ({
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
    printerLoaded: false
  };

  componentDidMount() {
    const { loadPrinter, printer } = this.props;
    if (!printer) {
      loadPrinter().then(() => {
        this.setState({
          printerLoaded: true
        });
      });
    } else {
      this.setState({
        printerLoaded: true
      });
    }
  }

  render() {
    const { printerLoaded } = this.state;
    const {
      printer,
      setPrinterConnection,
      changeCurrentJobState,
      patchPrinter,
      role,
      jobList,
      loadJobsPage,
      clearJobsPages
    } = this.props;
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
    return (
      <section className="content">
        <div className="printer-detail">
          <div className="printer-detail-stream">
            <WebcamStream {...printer.webcam} />
            <Progress {...printer.job} />
          </div>

          <div className="printer-detail-meta">
            <div className="container">
              <h1 className="main-title">{printer.name}</h1>
              <PrinterStatus
                printer={printer}
                onPrinterAuthorizationChanged={patchPrinter}
                onPrinterConnectionChanged={setPrinterConnection}
              />
              <PrinterCurrentPrintControl
                printer={printer}
                onCurrentJobStateChange={changeCurrentJobState}
              />
            </div>
          </div>

          <div className="printer-detail-jobs">
            <ul className="tabs-navigation">
              <li className="tab active">
                <h2>Jobs</h2>
              </li>
            </ul>
            <div className="tabs-content">
              <TableWrapper
                enableFiltering={false}
                itemList={jobList}
                loadPage={loadJobsPage}
                rowFactory={j => {
                  return <PrintJobRow key={j.id} {...j} />;
                }}
                sortByColumns={["started"]}
                clearItemsPages={clearJobsPages}
              />
            </div>
          </div>
          {role === "admin" && (
            <div className="cta-box text-center">
              <Link to={`/printers/${printer.host}/settings`}>
                <button className="btn">Printer settings</button>
              </Link>
            </div>
          )}
        </div>
      </section>
    );
  }
}

export default connect(
  (state, ownProps) => ({
    printer: state.printers.printers.find(
      p => p.host === ownProps.match.params.host
    ),
    role: state.users.me.role,
    jobList: state.printjobs[ownProps.match.params.host] || {
      pages: [],
      orderBy: "-started",
      filter: null,
      limit: 10
    }
  }),
  (dispatch, ownProps) => ({
    loadPrinter: () =>
      dispatch(
        loadPrinter(ownProps.match.params.host, ["job", "status", "webcam"])
      ),
    changeCurrentJobState: action =>
      dispatch(changeCurrentJob(ownProps.match.params.host, action)),
    patchPrinter: data =>
      dispatch(patchPrinter(ownProps.match.params.host, data)),
    setPrinterConnection: state =>
      dispatch(setPrinterConnection(ownProps.match.params.host, state)),
    loadJobsPage: (startWith, orderBy, filter, limit) =>
      dispatch(
        getJobsPage(
          ownProps.match.params.host,
          startWith,
          orderBy,
          filter,
          limit
        )
      ),
    clearJobsPages: () => dispatch(clearJobsPages(ownProps.match.params.host))
  })
)(PrinterDetail);
