import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import Loader from "../../components/utils/loader";
import SetActiveOrganization from "../../components/gateways/set-active-organization";
import PrinterState from "../../components/printers/printer-state";
import WebcamStream from "../../components/printers/webcam-stream";
import { loadPrinters, setPrinterViewType } from "../../actions";
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
    // this.printersLoading = props.printersLoading;
  }

  componentDidMount() {
    this.getPrinters();
  }

  getPrinters() {
    const { loadPrinters, printersLoading } = this.props;
    if (!printersLoading) {
      loadPrinters(["status", "client"]);
    }
    let timeout = setTimeout(() => {
      this.getPrinters();
    }, 3000);
    this.setState({
      timer: timeout,
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
          let currentJob =
            printer.client.octoprint &&
            printer.client.octoprint.printer &&
            printer.client.octoprint.printer.currentJob
              ? printer.client.octoprint.printer.currentJob
              : undefined;
          return (
            <Link
              className="list-item"
              role="listitem"
              key={printer.id}
              to={`/${match.params.orgid}/printers/${printer.id}`}
            >
              <div className="list-item-content">
                {viewType === "grid" && (
                  <div className="list-item-illustration">
                    <WebcamStream
                      orgId={match.params.orgid}
                      allowFullscreen={false}
                      printer={printer}
                    />
                  </div>
                )}

                <span className="list-item-title">{printer.name}</span>
                <span className="list-item-subtitle">
                  <PrinterState printer={printer} />
                </span>

                {currentJob &&
                  currentJob.completion &&
                  currentJob.completion !== 100 && (
                    <>
                      <div className="list-item-subtitle">
                        {currentJob.completion && (
                          <span>
                            {currentJob.completion.toFixed(2)}% done,{" "}
                          </span>
                        )}
                        <span>
                          ETA: {formatters.timespan(currentJob.printTimeLeft)}
                        </span>
                      </div>
                      <div className="list-item-property">
                        {currentJob.name}
                      </div>
                    </>
                  )}
              </div>
            </Link>
          );
        });
    const noPrinters =
      role === "admin" ? (
        <>
          <p>
            Looks like you didn't add any printers yet. Click the button below
            to get you started with Karmen.
          </p>
          <div className="cta-box text-center">
            <Link to={`/${match.params.orgid}/add-printer`} className="btn">
              Add your first printer
            </Link>
          </div>
        </>
      ) : (
        <>
          <p>
            Looks like there are no printers in this group. Only administrator
            can add new printers.
          </p>
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
                  to={`/${match.params.orgid}/add-printer`}
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
              <div className="list-items" role="list">
                {printerElements}
              </div>
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
      state.preferences.orgs[ownProps.match.params.orgid] &&
      state.preferences.orgs[ownProps.match.params.orgid].printerViewType,
    printers: state.printers.printers,
    printersLoaded: state.printers.printersLoaded,
    printersLoading: state.printers.loading,
    role: state.me.activeOrganization && state.me.activeOrganization.role,
  }),
  (dispatch, ownProps) => ({
    loadPrinters: (fields) => {
      return dispatch(loadPrinters(ownProps.match.params.orgid, fields));
    },
    setPrinterViewType: (viewType) => dispatch(setPrinterViewType(viewType)),
  })
)(PrinterList);
