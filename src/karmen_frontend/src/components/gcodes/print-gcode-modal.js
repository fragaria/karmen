import React, { useState } from "react";
import { useMyModal } from "../utils/modal";
import Loader from "../utils/loader";

export const usePrintGcodeModal = ({
  gcode,
  printGcode,
  onSchedulePrint,
  availablePrinters,
}) => {
  const { Modal, openModal, ...printModal } = useMyModal();

  const [showFilamentTypeWarning, setShowFilamentTypeWarning] = useState(false);
  const [printerFilamentType, setPrinterFilamentType] = useState();
  const [gcodeFilamentType, setGcodeFilamentType] = useState();
  const [message, setMessage] = useState();
  const [schedulingPrint, setSchedulingPrint] = useState();
  const [messageOk, setMessageOk] = useState();
  const [selectedPrinter, setSelectedPrinter] = useState(
    availablePrinters.length ? availablePrinters[0].uuid : null
  );
  const [showPrinterSelect, setShowPrinterSelect] = useState(true);
  const SelectPrinter = () => {
    const availablePrinterOpts = availablePrinters.map((p) => {
      return <option key={p.uuid} value={p.uuid}>{`${p.name}`}</option>;
    });
    return (
      <div className="modal-subtitle text-center">
        {!!availablePrinters.length ? (
          <label>
            Please, select the printer to print on:
            <select
              id="selectedPrinter"
              name="selectedPrinter"
              value={selectedPrinter}
              onChange={(e) => setSelectedPrinter(e.target.value)}
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
    onSchedulePrint(gcodeUuid, printerUuid)
      .then((r) => {
        setMessage("Print was scheduled");
        setMessageOk(true);
        setSchedulingPrint(false);
      })
      .catch((err) => {
        setMessage("Print was not scheduled");
        setMessageOk(false);
        setSchedulingPrint(false);
      });
  };

  return {
    ...printModal,
    openModal: (e) => {
      setSelectedPrinter(
        availablePrinters.length ? availablePrinters[0].uuid : null
      );
      setShowPrinterSelect(true);
      setShowFilamentTypeWarning(false);
      setMessage(undefined);
      setMessageOk(undefined);
      setSchedulingPrint(false);

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

            {schedulingPrint && (
              <div className="modal-content-narrow">
                <h2 className="modal-subtitle text-center">
                  Scheduling your print task...
                </h2>
                <Loader image />
                <p>
                  Your print file is being uploaded to the printer. Do not close
                  this dialog nor your browser window.
                </p>
              </div>
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
                      setSchedulingPrint(true);
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
              !schedulingPrint &&
              !!availablePrinters.length && (
                <div>
                  <div className="cta-box text-center">
                    <button
                      className="btn"
                      onClick={(e) => {
                        e.preventDefault();
                        const selected = availablePrinters.find(
                          (p) => p.uuid === selectedPrinter
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
                        setSchedulingPrint(true);
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
                </div>
              )}

            {(schedulingPrint || message) && (
              <div className="cta-box text-center">
                <button
                  className="btn"
                  onClick={() => {
                    printModal.closeModal();
                  }}
                >
                  {schedulingPrint ? "Cancel" : "Close"}
                </button>
              </div>
            )}
          </>
        </Modal>
      );
    },
  };
};

export default usePrintGcodeModal;
