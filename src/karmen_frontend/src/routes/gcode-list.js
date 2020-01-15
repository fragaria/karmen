import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { DebounceInput } from "react-debounce-input";

import { getGcodes, deleteGcode, printGcode } from "../services/backend";
import { loadPrinters } from "../actions/printers";
import formatters from "../services/formatters";

class GcodeRow extends React.Component {
  state = {
    showDeleteRow: false,
    showPrinterSelectRow: false,
    showPrintStatusRow: false,
    canCancelPrintStatusRow: true,
    message: "",
    messageOk: false,
    selectedPrinter: null,
    availablePrinters: [],
    showFilamentTypeWarningRow: false,
    printerFilamentType: "",
    gcodeFilamentType: ""
  };

  constructor(props) {
    super(props);
    this.schedulePrint = this.schedulePrint.bind(this);
  }

  schedulePrint(gcodeId, printerHost) {
    const { onSchedulePrint } = this.props;
    printGcode(gcodeId, printerHost).then(r => {
      switch (r) {
        case 201:
          this.setState({
            showPrinterSelectRow: false,
            canCancelPrintStatusRow: true,
            showPrintStatusRow: true,
            message: "Print was scheduled",
            messageOk: true
          });
          onSchedulePrint && onSchedulePrint(gcodeId, printerHost);
          break;
        default:
          this.setState({
            showPrinterSelectRow: false,
            canCancelPrintStatusRow: true,
            showPrintStatusRow: true,
            message: "Print was not scheduled",
            messageOk: false
          });
      }
    });
  }

  render() {
    const {
      showDeleteRow,
      showPrinterSelectRow,
      canCancelPrintStatusRow,
      showPrintStatusRow,
      showFilamentTypeWarningRow,
      selectedPrinter
    } = this.state;
    const {
      display,
      path,
      size,
      uploaded,
      onRowDelete,
      id,
      username,
      analysis,
      availablePrinters
    } = this.props;
    if (showPrintStatusRow) {
      const { message, messageOk } = this.state;
      return (
        <div className="list-item">
          {message && (
            <p className={messageOk ? "message-success" : "message-error"}>
              {message}
            </p>
          )}

          {canCancelPrintStatusRow && (
            <button
              className="btn-reset"
              onClick={() => {
                this.setState({
                  showPrintStatusRow: false
                });
              }}
            >
              <i className="icon-close"></i>
            </button>
          )}
        </div>
      );
    }
    if (showDeleteRow) {
      return (
        <div className="list-item list-item-inverse">
          <div className="list-item-content">
            <span className="list-item-title">
              Do you really want to delete{" "}
              <strong>
                {path}
                {path ? "/" : ""}
                {display}
              </strong>
              ? This cannot be undone.
            </span>
          </div>

          <div className="list-item-cta">
            <button
              className="btn-reset"
              title="Cancel"
              onClick={() => {
                this.setState({
                  showDeleteRow: false
                });
              }}
            >
              <i className="icon-close"></i>
            </button>
            <button
              className="btn-reset"
              title="Confirm delete"
              onClick={() => {
                onRowDelete();
              }}
            >
              <i className="icon-check"></i>
            </button>
          </div>
        </div>
      );
    }

    if (showFilamentTypeWarningRow) {
      const { printerFilamentType, gcodeFilamentType } = this.state;
      return (
        <div className="list-item list-item-inverse">
          <div className="list-item-content">
            <span className="list-item-title">
              Are you sure? There seems to be a filament mismatch: Printer has{" "}
              <strong>{printerFilamentType}</strong> configured, but this gcode
              was sliced for <strong>{gcodeFilamentType}</strong>.
            </span>
          </div>

          <div className="list-item-cta">
            <button
              className="btn-reset"
              title="Cancel"
              onClick={() => {
                this.setState({
                  showFilamentTypeWarningRow: false
                });
              }}
            >
              <i className="icon-close"></i>
            </button>
            <button
              className="btn-reset"
              title="Print"
              onClick={() => {
                const { selectedPrinter } = this.state;
                this.setState({
                  showPrinterSelectRow: false,
                  canCancelPrintStatusRow: false,
                  showFilamentTypeWarningRow: false,
                  showPrintStatusRow: true,
                  message: "Scheduling a print",
                  messageOk: true
                });
                this.schedulePrint(id, selectedPrinter);
              }}
            >
              <i className="icon-check"></i>
            </button>
          </div>
        </div>
      );
    }

    if (showPrinterSelectRow) {
      const availablePrinterOpts = availablePrinters.map(p => {
        return (
          <option key={p.host} value={p.host}>{`${p.name} (${p.host})`}</option>
        );
      });
      return (
        <div className="list-item">
          <div className="list-item-content">
            <span className="list-item-title">
              {!!availablePrinters.length ? (
                <>
                  Select printer to print on:{" "}
                  <select
                    id="selectedPrinter"
                    name="selectedPrinter"
                    value={selectedPrinter}
                    onChange={e =>
                      this.setState({
                        selectedPrinter: e.target.value
                      })
                    }
                  >
                    {availablePrinterOpts}
                  </select>
                </>
              ) : (
                <p>No available printers found.</p>
              )}
            </span>
          </div>

          <div className="list-item-cta">
            <button
              className="btn-reset"
              onClick={() => {
                this.setState({
                  showPrinterSelectRow: false,
                  selectedPrinter: null
                });
              }}
            >
              <i className="icon-close text-secondary"></i>
            </button>
            {!!availablePrinters.length && (
              <button
                className="btn-reset"
                onClick={e => {
                  e.preventDefault();
                  const { selectedPrinter } = this.state;
                  const selected = availablePrinters.find(
                    p => p.host === selectedPrinter
                  );
                  if (
                    selected &&
                    selected.printer_props &&
                    selected.printer_props.filament_type &&
                    analysis &&
                    analysis.filament &&
                    analysis.filament.type &&
                    analysis.filament.type !==
                      selected.printer_props.filament_type
                  ) {
                    this.setState({
                      showPrinterSelectRow: false,
                      showFilamentTypeWarningRow: true,
                      printerFilamentType: selected.printer_props.filament_type,
                      gcodeFilamentType: analysis.filament.type
                    });
                    return;
                  }
                  this.setState({
                    showPrinterSelectRow: false,
                    canCancelPrintStatusRow: false,
                    showFilamentTypeWarningRow: false,
                    showPrintStatusRow: true,
                    message: "Scheduling a print",
                    messageOk: true
                  });
                  this.schedulePrint(id, selectedPrinter);
                }}
              >
                <i className="icon-check text-success"></i>
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="list-item">
        <Link className="list-item-content" to={`/gcodes/${id}`}>
          <span className="list-item-subtitle">
            {path}
            {path ? "/" : ""}
            {display}
          </span>
          <span>{formatters.bytes(size)}, </span>
          <span>{formatters.datetime(uploaded)}, </span>
          <span>{username}</span>
        </Link>

        <div className="list-item-cta">
          <button
            className="btn-reset"
            onClick={() => {
              this.setState({
                selectedPrinter: availablePrinters.length
                  ? availablePrinters[0].host
                  : null,
                showPrinterSelectRow: true
              });
            }}
          >
            <i className="icon-printer"></i>
          </button>

          <button
            className="btn-reset"
            onClick={() => {
              this.setState({
                showDeleteRow: true
              });
            }}
          >
            <i className="icon-trash text-secondary"></i>
          </button>
        </div>
      </div>
    );
  }
}

class GcodeList extends React.Component {
  state = {
    gcodes: null,
    currentPage: 0,
    pages: [
      {
        startWith: null
      }
    ],
    orderBy: "-uploaded",
    filter: "",
    message: null,
    printedOn: []
  };

  constructor(props) {
    super(props);
    this.loadPage = this.loadPage.bind(this);
  }

  loadPage(page, newOrderBy, newFilter) {
    let { pages, orderBy, filter } = this.state;
    // reset pages if orderBy has changed
    if (newOrderBy !== orderBy || newFilter !== filter) {
      pages = [
        {
          startWith: null
        }
      ];
      page = 0;
    }
    getGcodes(pages[page].startWith, newOrderBy, newFilter, 15, [
      "id",
      "display",
      "filename",
      "path",
      "size",
      "uploaded",
      "analysis",
      "user_uuid",
      "username"
    ]).then(gcodes => {
      // Handles deleting of the last row on a non-zero page
      if (!gcodes.next && gcodes.items.length === 0 && page - 1 >= 0) {
        this.loadPage(page - 1, newOrderBy);
        return;
      }
      let nextStartWith;
      if (gcodes.next) {
        const uri = new URL(formatters.absoluteUrl(gcodes.next));
        nextStartWith = uri.searchParams.get("start_with");
      }
      if (nextStartWith) {
        pages.push({
          startWith: nextStartWith
        });
      } else {
        pages = [].concat(pages.slice(0, page + 1));
      }
      this.setState({
        gcodes: gcodes.items,
        currentPage: page,
        pages: pages,
        orderBy: newOrderBy,
        filter: newFilter
      });
    });
  }

  componentDidMount() {
    const { printersLoaded, loadPrinters } = this.props;
    if (!printersLoaded) {
      loadPrinters();
    }
    const { orderBy } = this.state;
    this.loadPage(0, orderBy);
  }

  render() {
    const {
      gcodes,
      currentPage,
      pages,
      orderBy,
      filter,
      printedOn
    } = this.state;
    const { getAvailablePrinters } = this.props;
    const gcodeRows =
      gcodes &&
      gcodes.map(g => {
        return (
          <GcodeRow
            key={g.id}
            {...g}
            history={this.props.history}
            onSchedulePrint={(gcode, printer) => {
              printedOn.push(printer);
              this.setState({
                printedOn: [].concat(printedOn)
              });
            }}
            availablePrinters={getAvailablePrinters(printedOn)}
            onRowDelete={() => {
              deleteGcode(g.id).then(() => {
                this.loadPage(currentPage, orderBy);
              });
            }}
          />
        );
      });

    return (
      <section className="content">
        <div className="container">
          <h1 className="main-title">
            G-Codes
            <Link to="/add-gcode" className="btn btn-sm">
              + Upload a g-code
            </Link>
          </h1>

          <form className="input-group">
            <label htmlFor="filter">
              <span className="input-label-icon icon-search"></span>
              <DebounceInput
                type="search"
                name="filter"
                id="filter"
                minLength={3}
                debounceTimeout={300}
                onChange={e => {
                  this.loadPage(currentPage, orderBy, e.target.value);
                }}
              />
            </label>
          </form>
        </div>

        <div className="list">
          {gcodes === null ? (
            <p className="list-item list-item-message">Loading...</p>
          ) : !gcodeRows || gcodeRows.length === 0 ? (
            <p className="list-item list-item-message">No G-Codes found!</p>
          ) : (
            <>
              <div className="list-header">
                <button
                  className={`plain sorting-button ${
                    orderBy.indexOf("filename") > -1 ? "active" : ""
                  }`}
                  onClick={() => {
                    let order = "+filename";
                    if (orderBy === "+filename") {
                      order = "-filename";
                    } else if (orderBy === "-filename") {
                      order = "-uploaded";
                    }
                    this.loadPage(currentPage, order, filter);
                  }}
                >
                  Filename
                </button>
                <button
                  className={`plain sorting-button ${
                    orderBy.indexOf("size") > -1 ? "active" : ""
                  }`}
                  onClick={() => {
                    let order = "+size";
                    if (orderBy === "+size") {
                      order = "-size";
                    } else if (orderBy === "-size") {
                      order = "-uploaded";
                    }
                    this.loadPage(currentPage, order, filter);
                  }}
                >
                  Size
                </button>
                <button
                  className={`plain sorting-button ${
                    orderBy.indexOf("uploaded") > -1 ? "active" : ""
                  }`}
                  onClick={() => {
                    let order = "+uploaded";
                    if (orderBy === "+uploaded") {
                      order = "-uploaded";
                    }
                    this.loadPage(currentPage, order, filter);
                  }}
                >
                  Uploaded at
                </button>
              </div>

              {gcodeRows}

              <div className="list-pagination">
                {currentPage > 0 ? (
                  <button
                    className="btn-reset"
                    onClick={() =>
                      this.loadPage(
                        Math.max(0, currentPage - 1),
                        orderBy,
                        filter
                      )
                    }
                  >
                    Previous
                  </button>
                ) : (
                  <span></span>
                )}
                {pages[currentPage + 1] ? (
                  <button
                    className="btn-reset"
                    onClick={() =>
                      this.loadPage(currentPage + 1, orderBy, filter)
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
        </div>
      </section>
    );
  }
}

export default connect(
  state => ({
    printersLoaded: state.printers.printersLoaded,
    getAvailablePrinters: (without = []) =>
      state.printers.printers
        .filter(p => p.status && p.status.state === "Operational")
        .filter(p => p.client && p.client.connected)
        .filter(p => p.client && p.client.access_level === "unlocked")
        .filter(p => without.indexOf(p.host) === -1)
  }),
  dispatch => ({
    loadPrinters: () => dispatch(loadPrinters(["status"]))
  })
)(GcodeList);
