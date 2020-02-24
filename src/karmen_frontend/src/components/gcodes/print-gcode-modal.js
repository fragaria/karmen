import React, { useState } from "react";
import { useMyModal } from "../utils/modal";

export const usePrintGcodeModal = ({
  gcode,
  printGcode,
  onSchedulePrint,
  availablePrinters
}) => {
  const { Modal, openModal, ...printModal } = useMyModal();

  const [showFilamentTypeWarning, setShowFilamentTypeWarning] = useState(false);
  const [printerFilamentType, setPrinterFilamentType] = useState();
  const [gcodeFilamentType, setGcodeFilamentType] = useState();
  const [message, setMessage] = useState();
  const [messageOk, setMessageOk] = useState();
  const [selectedPrinter, setSelectedPrinter] = useState(
    availablePrinters.length ? availablePrinters[0].uuid : null
  );
  const [showPrinterSelect, setShowPrinterSelect] = useState(true);

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
              onChange={e => setSelectedPrinter(e.target.value)}
            >
              {availablePrinterOpts}
            </select>
          </label>
        ) : (
          <p className="message-error">No available printers found.</p>
        )}
      </div>
    );
  };

  const schedulePrint = (gcodeUuid, printerUuid) => {
    onSchedulePrint(gcodeUuid, printerUuid).then(r => {
      switch (r) {
        case 201:
          setMessage("Print was scheduled");
          setMessageOk(true);
          break;
        default:
          setMessage("Print was not scheduled");
          setMessageOk(false);
      }
    });
  };

  return {
    ...printModal,
    openModal: e => {
      setSelectedPrinter(
        availablePrinters.length ? availablePrinters[0].uuid : null
      );
      setShowPrinterSelect(true);
      setShowFilamentTypeWarning(false);
      setMessage(undefined);
      setMessageOk(undefined);
      return openModal(e);
    },
    Modal: () => {
      return (
        <Modal>
          <>
            <h1 className="modal-title text-center">Print G-Code</h1>

            {showPrinterSelect && <SelectPrinter />}

            {message && (
              <p className={messageOk ? "message-success" : "message-error"}>
                {message}
              </p>
            )}

            {showFilamentTypeWarning && (
              <>
                <div className="message-error">
                  Are you sure? There seems to be a filament mismatch: Printer
                  has <strong>{printerFilamentType}</strong> configured, but
                  this gcode was sliced for <strong>{gcodeFilamentType}</strong>
                  .
                </div>

                <div className="cta-box text-center">
                  <button
                    className="btn"
                    onClick={() => {
                      setShowPrinterSelect(false);
                      setShowFilamentTypeWarning(false);
                      setMessage("Scheduling a print");
                      setMessageOk(true);
                      schedulePrint(gcode.uuid, selectedPrinter);
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

            {!showFilamentTypeWarning &&
              !message &&
              !!availablePrinters.length && (
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
                        gcode.analysis &&
                        gcode.analysis.filament &&
                        gcode.analysis.filament.type &&
                        gcode.analysis.filament.type !==
                          selected.printer_props.filament_type
                      ) {
                        setShowPrinterSelect(false);
                        setShowFilamentTypeWarning(true);
                        setPrinterFilamentType(
                          selected.printer_props.filament_type
                        );
                        setGcodeFilamentType(gcode.analysis.filament.type);
                        return;
                      }

                      setShowPrinterSelect(false);
                      setShowFilamentTypeWarning(false);
                      setMessage("Scheduling a print");
                      setMessageOk(true);
                      schedulePrint(gcode.uuid, selectedPrinter);
                    }}
                  >
                    Print
                  </button>

                  <button
                    className="btn btn-plain"
                    onClick={() => {
                      printModal.closeModal();
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}

            {!!!availablePrinters.length && (
              <div className="cta-box text-center">
                <button
                  className="btn"
                  onClick={() => {
                    printModal.closeModal();
                  }}
                >
                  Close
                </button>
              </div>
            )}
          </>
        </Modal>
      );
    }
  };
};

export default usePrintGcodeModal;
