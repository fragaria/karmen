import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { DebounceInput } from "react-debounce-input";

import TableActionRow from "../components/table-action-row";
import TableSorting from "../components/table-sorting";
import { getGcodes, deleteGcode, printGcode } from "../services/backend";
import { loadPrinters } from "../actions/printers";
import formatters from "../services/formatters";

class GcodeTableRow extends React.Component {
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
        <TableActionRow
          inverse={false}
          showCancel={canCancelPrintStatusRow}
          onCancel={() => {
            this.setState({
              showPrintStatusRow: false
            });
          }}
          showConfirm={false}
        >
          {message && (
            <p className={messageOk ? "message-success" : "message-error"}>
              {message}
            </p>
          )}
        </TableActionRow>
      );
    }

    if (showDeleteRow) {
      return (
        <TableActionRow
          onCancel={() => {
            this.setState({
              showDeleteRow: false
            });
          }}
          onConfirm={() => {
            onRowDelete();
          }}
        >
          Do you really want to delete{" "}
          <strong>
            {path}
            {path ? "/" : ""}
            {display}
          </strong>
          ? This cannot be undone.
        </TableActionRow>
      );
    }

    if (showFilamentTypeWarningRow) {
      const { printerFilamentType, gcodeFilamentType } = this.state;
      return (
        <TableActionRow
          onCancel={() => {
            this.setState({
              showFilamentTypeWarningRow: false
            });
          }}
          onConfirm={() => {
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
          Are you sure? There seems to be a filament mismatch: Printer has{" "}
          <strong>{printerFilamentType}</strong> configured, but this gcode was
          sliced for <strong>{gcodeFilamentType}</strong>.
        </TableActionRow>
      );
    }

    if (showPrinterSelectRow) {
      const availablePrinterOpts = availablePrinters.map(p => {
        return (
          <option key={p.host} value={p.host}>{`${p.name} (${p.host})`}</option>
        );
      });
      return (
        <TableActionRow
          inverse={false}
          onCancel={() => {
            this.setState({
              showPrinterSelectRow: false,
              selectedPrinter: null
            });
          }}
          showConfirm={!!availablePrinters.length}
          onConfirm={e => {
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
              analysis.filament.type !== selected.printer_props.filament_type
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
        </TableActionRow>
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

  // TODO move this to redux, reuse TableWrapper
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
    getGcodes(pages[page].startWith, newOrderBy, newFilter, 10, [
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
    const GcodeTableRows =
      gcodes &&
      gcodes.map(g => {
        return (
          <GcodeTableRow
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
        </div>

        <div className="list">
          <div className="list-header">
            <div className="list-search">
              <label htmlFor="filter">
                <span className="icon icon-search"></span>
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
            </div>

            <TableSorting
              active={orderBy}
              columns={["filename", "size", "uploaded"]}
              onChange={column => {
                return () => {
                  const { orderBy } = this.state;
                  this.loadPage(
                    currentPage,
                    orderBy === `+${column}` ? `-${column}` : `+${column}`,
                    filter
                  );
                };
              }}
            />
          </div>

          {gcodes === null ? (
            <p className="list-item list-item-message">Loading...</p>
          ) : !GcodeTableRows || GcodeTableRows.length === 0 ? (
            <p className="list-item list-item-message">No G-Codes found!</p>
          ) : (
            <>
              {GcodeTableRows}

              <div className="list-pagination">
                {currentPage > 0 ? (
                  <button
                    className="btn btn-sm"
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
                {currentPage > 0 && pages[currentPage + 1] && " "}
                {pages[currentPage + 1] ? (
                  <button
                    className="btn btn-sm"
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
