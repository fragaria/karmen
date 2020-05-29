import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import Loader from "../../components/utils/loader";
import SetActiveOrganization from "../../components/gateways/set-active-organization";
import PrinterState from "../../components/printers/printer-state";
import WebcamStream from "../../components/printers/webcam-stream";
import { loadAndQueuePrinters, setPrinterViewType } from "../../actions";
import formatters from "../../services/formatters";

const SwitchView = ({ viewType, onViewTypeChange }) => {
  return (
    <div className="list-header">
      <div className="list-view-switch">
        <button
          className={
            viewType === "grid"
              ? "btn-reset icon-list"
              : "btn-reset icon-list active"
          }
          onClick={(e) => {
            e.preventDefault();
            if (e.target.className.indexOf("active") < 0) {
              onViewTypeChange("list");
            }
          }}
        ></button>
        <button
          className={
            viewType === "grid"
              ? "btn-reset icon-grid active"
              : "btn-reset icon-grid"
          }
          onClick={(e) => {
            e.preventDefault();
            if (e.target.className.indexOf("active") < 0) {
              onViewTypeChange("grid");
            }
          }}
        ></button>
      </div>
    </div>
  );
};

class PrinterList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      timer: null,
    };
    this.getPrinters = this.getPrinters.bind(this);
  }

  componentDidMount() {
    this.getPrinters();
  }

  getPrinters() {
    const { printersLoaded, loadPrinters } = this.props;
    let load;
    if (printersLoaded) {
      load = loadPrinters(["status"]);
    } else {
      load = loadPrinters(["job", "status", "webcam", "lights"]);
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

  render() {
    const {
      match,
      printersLoaded,
      printers,
      viewType,
      setPrinterViewType,
      role,
    } = this.props;
    if (!printersLoaded) {
      return (
        <div>
          <SetActiveOrganization />
          <Loader />
        </div>
      );
    }

    const printerElements =
      printers &&
      printers
        .filter((p) => !!p)
        .map((printer) => {
          return (
            <Link
              className="list-item"
              key={printer.uuid}
              to={`/${match.params.orguuid}/printers/${printer.uuid}`}
            >
              <div className="list-item-content">
                {viewType === "grid" && (
                  <div className="list-item-illustration">
                    <WebcamStream
                      orgUuid={match.params.orguuid}
                      allowFullscreen={false}
                      printer={printer}
                    />
                  </div>
                )}

                <span className="list-item-title">{printer.name}</span>
                <span className="list-item-subtitle">
                  <PrinterState printer={printer} />
                </span>

                {printer.job && printer.job.name && (
                  <>
                    <div className="list-item-subtitle">
                      {printer.job.completion && (
                        <span>{printer.job.completion.toFixed(2)}% done, </span>
                      )}
                      <span>
                        ETA: {formatters.timespan(printer.job.printTimeLeft)}
                      </span>
                    </div>
                    <div className="list-item-property">{printer.job.name}</div>
                  </>
                )}
              </div>
            </Link>
          );
        });
    const noPrinters = (
      <>
        <p>
          Looks like you didn't add any printers yet. Click the button below to
          get you started with Karmen.
        </p>
        <div className="cta-box text-center">
          <Link to={`/${match.params.orguuid}/add-printer`} className="btn">
            Add your first printer
          </Link>
        </div>
      </>
    );

    return (
      <>
        <div className="content printer-list">
          <div className="container">
            <h1 className="main-title">
              Printers
              {role === "admin" && (
                <Link
                  to={`/${match.params.orguuid}/add-printer`}
                  className="btn btn-sm"
                  id="btn-add_printer"
                >
                  <span>+ Add a printer</span>
                </Link>
              )}
            </h1>
            {printerElements.length === 0 && noPrinters}
          </div>
          {printerElements.length > 0 && (
            <div className={viewType === "grid" ? "list grid" : "list"}>
              <SwitchView
                viewType={viewType}
                onViewTypeChange={setPrinterViewType}
              />
              <div className="list-items">{printerElements}</div>
            </div>
          )}
        </div>
      </>
    );
  }
}

export default connect(
  (state, ownProps) => ({
    viewType:
      state.preferences.orgs[ownProps.match.params.orguuid] &&
      state.preferences.orgs[ownProps.match.params.orguuid].printerViewType,
    printers: state.printers.printers,
    printersLoaded: state.printers.printersLoaded,
    role: state.me.activeOrganization && state.me.activeOrganization.role,
  }),
  (dispatch, ownProps) => ({
    loadPrinters: (fields) =>
      dispatch(loadAndQueuePrinters(ownProps.match.params.orguuid, fields)),
    setPrinterViewType: (viewType) => dispatch(setPrinterViewType(viewType)),
  })
)(PrinterList);
