import React from "react";
import { connect } from "react-redux";
import { Link, Redirect } from "react-router-dom";

import Loader from "../components/loader";
import BusyButton from "../components/busy-button";
import TableWrapper from "../components/table-wrapper";
import Progress from "../components/progress";
import { WebcamStream } from "../components/webcam-stream";
import PrinterState from "../components/printer-state";
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
    return onPrinterConnectionChanged(targetState).then(r => {
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
    if (["Connecting"].indexOf(printer.status.state) > -1) {
      return <></>;
    }
    return (
      <form className="inline-form">
        {showConnectionWarningRow ? (
          <div>
            <p className="message-warning">
              Are you sure? This might affect any current printer operation.
            </p>
            <BusyButton
              className="btn btn-sm"
              type="submit"
              onClick={e => {
                e.preventDefault();
                this.setState({
                  submitting: true
                });
                return this.changePrinterConnection();
              }}
              busyChildren="Working..."
            >
              Yes, please
            </BusyButton>{" "}
            <button
              type="reset"
              className={submitting ? "hidden" : "btn btn-sm btn-plain"}
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
          <>
            &nbsp;
            {printer.client.access_level === "unlocked" &&
              (["Offline", "Closed"].indexOf(printer.status.state) > -1 ||
              printer.status.state.match(/printer is not/i) ? (
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
                >
                  Connect
                </button>
              ) : (
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
                >
                  Disconnect
                </button>
              ))}
          </>
        )}
      </form>
    );
  }
}

class PrinterAuthorizationForm extends React.Component {
  state = {
    apiKey: ""
  };

  constructor(props) {
    super(props);
    this.setApiKey = this.setApiKey.bind(this);
  }

  setApiKey(e) {
    e.preventDefault();
    const { apiKey } = this.state;
    const { onPrinterAuthorizationChanged } = this.props;
    return onPrinterAuthorizationChanged({
      api_key: apiKey
    }).then(r => {
      this.setState({
        apiKey: ""
      });
    });
  }

  render() {
    const { printer } = this.props;
    const { apiKey } = this.state;
    const getAccessLevelString = level => {
      switch (level) {
        case "read_only":
        case "protected":
          return "Unlock with API key";
        case "unlocked":
          return "Full access";
        case "unknown":
        default:
          return "Unknown";
      }
    };
    if (["unlocked", "unknown"].indexOf(printer.client.access_level) !== -1) {
      return <></>;
    }
    return (
      <>
        <p></p>
        <p>{getAccessLevelString(printer.client.access_level)}</p>
        <form className="inline-form inline-form-sm">
          <input
            type="text"
            id="apiKey"
            name="apiKey"
            value={apiKey || ""}
            onChange={e => {
              this.setState({
                apiKey: e.target.value
              });
            }}
          />
          <BusyButton
            className="btn btn-sm"
            type="submit"
            onClick={this.setApiKey}
            busyChildren="Working..."
            disabled={!apiKey}
          >
            Set API key
          </BusyButton>
        </form>
      </>
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
        <div className="cta-box">
          <p className="message-warning">
            Are you sure? You are about to cancel the whole print!
          </p>
          <button
            className="btn btn-sm"
            onClick={() => {
              onCurrentJobStateChange("cancel").then(() => {
                this.setState({
                  showCancelWarning: false
                });
              });
            }}
          >
            Cancel the print!
          </button>{" "}
          <button
            className="btn btn-plain btn-sm"
            onClick={() => {
              this.setState({
                showCancelWarning: false
              });
            }}
          >
            Close
          </button>
        </div>
      );
    }

    return (
      <div className="cta-box text-center">
        {printer.status.state === "Paused" ? (
          <button
            className="btn btn-sm"
            onClick={() => {
              onCurrentJobStateChange("resume");
            }}
          >
            Resume print
          </button>
        ) : (
          <button
            className="btn btn-sm"
            onClick={() => {
              onCurrentJobStateChange("pause");
            }}
          >
            Pause print
          </button>
        )}{" "}
        <button
          className="btn btn-sm"
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

const PrinterConnectionStatus = ({ printer }) => {
  return (
    <>
      <dt className="term">Client: </dt>
      <dd className="description">
        {printer.client.name} (
        <code>{JSON.stringify(printer.client.version)}</code>)
      </dd>

      <dt className="term">Client host: </dt>
      <dd className="decription">
        {printer.hostname && (
          <a
            className="anchor"
            href={`${printer.protocol}://${printer.hostname}${
              printer.port ? `:${printer.port}` : ""
            }`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {printer.hostname}
            {printer.port ? `:${printer.port}` : ""}
          </a>
        )}
        {printer.hostname && " ("}
        <a
          className="anchor"
          href={`${printer.protocol}://${printer.ip}${
            printer.port ? `:${printer.port}` : ""
          }`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {printer.ip}
          {printer.port ? `:${printer.port}` : ""}
        </a>
        {printer.hostname && ")"}
      </dd>
      {printer.client.api_key && (
        <>
          <dt className="term">API Key: </dt>
          <dd className="decription">{printer.client.api_key}</dd>
        </>
      )}
    </>
  );
};

const PrinterProperties = ({ printer }) => {
  const props = printer.printer_props;
  return (
    <>
      {props &&
        (props.filament_type ||
          props.filament_color ||
          props.bed_type ||
          props.tool0_diameter) && (
          <>
            <dt className="term">Filament type:</dt>
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
    </>
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

              <PrinterState printer={printer} />

              <PrinterConnectionForm
                printer={printer}
                onPrinterConnectionChanged={setPrinterConnection}
              />

              {role === "admin" && (
                <PrinterAuthorizationForm
                  printer={printer}
                  onPrinterAuthorizationChanged={patchPrinter}
                />
              )}

              <dl className="dl-horizontal">
                <PrinterProperties printer={printer} />
                <PrinterConnectionStatus printer={printer} />
              </dl>

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

            {role === "admin" && (
              <div className="cta-box text-center">
                <Link to={`/printers/${printer.uuid}/settings`}>
                  <button className="btn">Printer settings</button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }
}

export default connect(
  (state, ownProps) => ({
    printer: state.printers.printers.find(
      p => p.uuid === ownProps.match.params.uuid
    ),
    role: state.users.me.role,
    jobList: state.printjobs[ownProps.match.params.uuid] || {
      pages: [],
      orderBy: "-started",
      filter: null,
      limit: 10
    }
  }),
  (dispatch, ownProps) => ({
    loadPrinter: () =>
      dispatch(
        loadPrinter(ownProps.match.params.uuid, ["job", "status", "webcam"])
      ),
    changeCurrentJobState: action =>
      dispatch(changeCurrentJob(ownProps.match.params.uuid, action)),
    patchPrinter: data =>
      dispatch(patchPrinter(ownProps.match.params.uuid, data)),
    setPrinterConnection: state =>
      dispatch(setPrinterConnection(ownProps.match.params.uuid, state)),
    loadJobsPage: (startWith, orderBy, filter, limit) =>
      dispatch(
        getJobsPage(
          ownProps.match.params.uuid,
          startWith,
          orderBy,
          filter,
          limit
        )
      ),
    clearJobsPages: () => dispatch(clearJobsPages(ownProps.match.params.uuid))
  })
)(PrinterDetail);
