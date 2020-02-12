import React, { useState } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

import Listing from "../components/listings/wrapper";
import CtaDropdown from "../components/listings/cta-dropdown";
import {
  getGcodesPage,
  clearGcodesPages,
  deleteGcode
} from "../actions/gcodes";
import { useMyModal } from "../components/utils/modal";
import { addPrintJob } from "../actions/printjobs";
import { loadPrinters } from "../actions/printers";
import formatters from "../services/formatters";

const DeleteModal = ({ modal, path, display, onRowDelete }) => {
  return (
    <>
      {modal.isOpen && (
        <modal.Modal>
          <h1 className="modal-title text-center">
            Delete G-Code
          </h1>

          <h3 className="text-center">
            Do you really want to delete{" "}
            <strong>
              {path}
              {path ? "/" : ""}
              {display}
            </strong>
            ? This cannot be undone.
          </h3>

          <div className="cta-box text-center">
            <button
              className="btn"
              onClick={() => {
                onRowDelete();
              }}
            >
              Yes, delete it
            </button>

            <button className="btn btn-plain" onClick={modal.closeModal}>
              Cancel
            </button>
          </div>
        </modal.Modal>
      )}
    </>
  );
};

const GcodeTableRow = ({ 
  analysis,
  id, 
  size, 
  uploaded, 
  username, 
  path,
  display, 
  history, 
  printGcode, 
  onSchedulePrint, 
  availablePrinters, 
  onRowDelete 
}) => {
  const deleteModal = useMyModal();
  const printModal = useMyModal();
  
  const [ctaListExpanded, setCtaListExpanded] = useState();
  const [showFilamentTypeWarning, setShowFilamentTypeWarning] = useState();
  const [printerFilamentType, setPrinterFilamentType] = useState();
  const [gcodeFilamentType, setGcodeFilamentType] = useState();
  const [canCancelPrintStatus, setCanCancelPrintStatus] = useState();
  const [message, setMessage] = useState();
  const [messageOk, setMessageOk] = useState();
  const [selectedPrinter, setSelectedPrinter] = useState();
  const [showPrinterSelect, setShowPrinterSelect] = useState();

  const SelectPrinter = () => {
    const availablePrinterOpts = availablePrinters.map(p => {
        return <option key={p.uuid} value={p.uuid}>{`${p.name}`}</option>;
      });
    return (
      <div className="text-center">
        {!!availablePrinters.length ? (
          <label>
            Please, select the printer to print on:
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
          </label>
        ) : (
          <p className="message-error">No available printers found.</p>
        )}
      </div>
    );
  }

  const schedulePrint = (gcodeId, printerUuid) => {
    onSchedulePrint(gcodeId, printerUuid).then(r => {
      switch (r) {
        case 201:
          setCanCancelPrintStatus(true);
          setMessage("Print was scheduled");
          setMessageOk(true);
          break;
        default:
          setCanCancelPrintStatus(true);
          setMessage("Print was not scheduled");
          setMessageOk(false);
      }
    });
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

      <CtaDropdown
        expanded={ctaListExpanded}
        onToggle={() => {
          setCtaListExpanded(!ctaListExpanded);
        }}
      >
        <button
          className="list-dropdown-item"
          onClick={(e) => {
            setCtaListExpanded(false);
            setSelectedPrinter(availablePrinters.length ? availablePrinters[0].uuid : null);
            setShowPrinterSelect(true);
            printModal.openModal(e);
          }}
        >
          <i className="icon-printer"></i>
          Print g-code
        </button>

        <button
          className="list-dropdown-item text-secondary"
          onClick={(e) => {
            setCtaListExpanded(false);
            deleteModal.openModal(e);
          }}
        >
          <i className="icon-trash"></i>
          Delete g-code
        </button>
      </CtaDropdown>

      <printModal.Modal>
        <>
          <h1 className="modal-title text-center">
            Print G-Code
          </h1>
          
          {showPrinterSelect && (
            <SelectPrinter />
          )}

          {message && (
            <p className={messageOk ? "message-success" : "message-error"}>
              {message}
            </p>
          )}

          {showFilamentTypeWarning && (
          <>
            <div className="message-error">
              Are you sure? There seems to be a filament mismatch: Printer has{" "}
              <strong>{printerFilamentType}</strong> configured, but this gcode was
              sliced for <strong>{gcodeFilamentType}</strong>.
            </div>

            <div className="cta-box text-center">  
              <button
                className="btn"
                onClick={() => {
                  setShowPrinterSelect(false);
                  setShowFilamentTypeWarning(false);
                  setCanCancelPrintStatus(false);
                  setMessage("Scheduling a print");
                  setMessageOk(true);
                  schedulePrint(id, selectedPrinter);
                }}
              >
                Print anyway
              </button>{" "}
              <button 
                className="btn btn-plain"
                onClick={() => {
                  setShowPrinterSelect(true);
                  setShowFilamentTypeWarning(false);
                }}
              >
                Cancel
              </button>
            </div>
          </>
          )}

          {!showFilamentTypeWarning && !message && !!availablePrinters.length && (
          <div className="cta-box text-center">
            <button
              className="btn"
              onClick={e => {
                e.preventDefault();
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
                  setShowPrinterSelect(false);
                  setShowFilamentTypeWarning(true);
                  setPrinterFilamentType(selected.printer_props.filament_type);
                  setGcodeFilamentType(analysis.filament.type)
                  return;
                }

                setShowPrinterSelect(false);
                setCanCancelPrintStatus(false);
                setShowFilamentTypeWarning(false);
                setMessage("Scheduling a print");
                setMessageOk(true);

                schedulePrint(id, selectedPrinter);
              }}
            >
              Print
            </button>

            <button className="btn btn-plain" onClick={printModal.closeModal}>
              Cancel
            </button>
          </div>
          )}

          {!!!availablePrinters.length && (
            <div className="cta-box text-center">
              <button className="btn" onClick={printModal.closeModal}>
                Close
              </button>
            </div>
          )}
        </>
      </printModal.Modal>      
    
      <DeleteModal
        path={path}
        display={display}
        modal={deleteModal}
        onRowDelete={onRowDelete}
      />
    </div>
  );
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

        <Listing
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
    loadPrinters: () => dispatch(loadPrinters(["job", "status", "webcam"])),
    loadGcodesPage: (startWith, orderBy, filter, limit, fields) =>
      dispatch(getGcodesPage(startWith, orderBy, filter, limit, fields)),
    clearGcodesPages: () => dispatch(clearGcodesPages()),
    deleteGcode: id => dispatch(deleteGcode(id)),
    printGcode: (id, printer) => dispatch(addPrintJob(id, printer))
  })
)(GcodeList);
