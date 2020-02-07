import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

import TableWrapper from "../components/table-wrapper";
import TableActionRow from "../components/table-action-row";
import ListCta from "../components/list-cta";
import {
  getGcodesPage,
  clearGcodesPages,
  deleteGcode
} from "../actions/gcodes";
import { addPrintJob } from "../actions/printjobs";
import { loadPrinters } from "../actions/printers";
import formatters from "../services/formatters";

class GcodeTableRow extends React.Component {
  state = {
    ctaListExpanded: false,
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

  schedulePrint(gcodeId, printerUuid) {
    const { onSchedulePrint } = this.props;
    onSchedulePrint(gcodeId, printerUuid).then(r => {
      switch (r) {
        case 201:
          this.setState({
            showPrinterSelectRow: false,
            canCancelPrintStatusRow: true,
            showPrintStatusRow: true,
            message: "Print was scheduled",
            messageOk: true
          });
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
      selectedPrinter,
      ctaListExpanded
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
        return <option key={p.uuid} value={p.uuid}>{`${p.name}`}</option>;
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
              p => p.uuid === selectedPrinter
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

        <ListCta
          expanded={ctaListExpanded}
          onToggle={() => {
            this.setState({ ctaListExpanded: !ctaListExpanded });
          }}
        >
          <button
            className="list-dropdown-item"
            onClick={() => {
              this.setState({
                selectedPrinter: availablePrinters.length
                  ? availablePrinters[0].uuid
                  : null,
                showPrinterSelectRow: true,
                ctaListExpanded: false
              });
            }}
          >
            <i className="icon-printer"></i>
            Print g-code
          </button>

          <button
            className="list-dropdown-item text-secondary"
            onClick={() => {
              this.setState({
                showDeleteRow: true,
                ctaListExpanded: false
              });
            }}
          >
            <i className="icon-trash"></i>
            Delete g-code
          </button>
        </ListCta>
      </div>
    );
  }
}

class GcodeList extends React.Component {
  state = {
    printedOn: []
  };

  componentDidMount() {
    const { printersLoaded, loadPrinters } = this.props;
    if (!printersLoaded) {
      loadPrinters();
    }
  }

  render() {
    const { printedOn } = this.state;
    const {
      getAvailablePrinters,
      gcodesList,
      loadGcodesPage,
      clearGcodesPages,
      deleteGcode,
      printGcode
    } = this.props;

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

        <TableWrapper
          rowFactory={g => {
            return (
              <GcodeTableRow
                key={g.id}
                {...g}
                history={this.props.history}
                printGcode={printGcode}
                onSchedulePrint={(gcodeId, printerUuid) => {
                  return printGcode(gcodeId, printerUuid).then(r => {
                    if (r === 201) {
                      printedOn.push(printerUuid);
                      this.setState({
                        printedOn: [].concat(printedOn)
                      });
                    }
                    return r;
                  });
                }}
                availablePrinters={getAvailablePrinters(printedOn)}
                onRowDelete={() => {
                  deleteGcode(g.id).then(() => {
                    loadGcodesPage(
                      gcodesList.startWith,
                      gcodesList.orderBy,
                      gcodesList.filter,
                      gcodesList.limit,
                      gcodesList.fields
                    );
                  });
                }}
              />
            );
          }}
          itemList={gcodesList}
          sortByColumns={["filename", "size", "uploaded"]}
          loadPage={loadGcodesPage}
          clearItemsPages={clearGcodesPages}
          fields={[
            "id",
            "display",
            "filename",
            "path",
            "size",
            "uploaded",
            "analysis",
            "user_uuid",
            "username"
          ]}
        />
      </section>
    );
  }
}

export default connect(
  state => ({
    printersLoaded: state.printers.printersLoaded,
    gcodesList: state.gcodes.list,
    getAvailablePrinters: (without = []) =>
      state.printers.printers
        .filter(p => p.status && p.status.state === "Operational")
        .filter(p => p.client && p.client.connected)
        .filter(p => p.client && p.client.access_level === "unlocked")
        .filter(p => without.indexOf(p.uuid) === -1)
  }),
  dispatch => ({
    loadPrinters: () => dispatch(loadPrinters(["status"])),
    loadGcodesPage: (startWith, orderBy, filter, limit, fields) =>
      dispatch(getGcodesPage(startWith, orderBy, filter, limit, fields)),
    clearGcodesPages: () => dispatch(clearGcodesPages()),
    deleteGcode: id => dispatch(deleteGcode(id)),
    printGcode: (id, printer) => dispatch(addPrintJob(id, printer))
  })
)(GcodeList);
