import React, { useState } from "react";
import BusyButton from "../../utils/busy-button";
import { useMyModal } from "../../utils/modal";

const CancelPrintModal = ({ modal, onCurrentJobStateChange }) => {
  return (
    <>
      {modal.isOpen && (
        <modal.Modal>
          <h1 className="modal-title text-center">
            Are you sure? You are about to cancel the whole print!
          </h1>
          <div className="cta-box text-center">
            <button
              className="btn"
              onClick={() => {
                onCurrentJobStateChange("cancel").then(() => {
                  modal.closeModal();
                });
              }}
            >
              Cancel the print!
            </button>{" "}
            <button className="btn btn-plain" onClick={modal.closeModal}>
              Close
            </button>
          </div>
        </modal.Modal>
      )}
    </>
  );
};

const PrinterCurrentPrintControl = ({ printer, onCurrentJobStateChange }) => {
  const cancelPrintModal = useMyModal();

  if (
    !printer.client.octoprint.printer.state.flags.printing && !printer.client.octoprint.printer.state.flags.paused
  ) {
    return <></>;
  }

  return (
    <>
      <label>Print</label>

      <div>
        {printer.client.octoprint.printer.state.flags.paused ? (
          <button
            className="btn btn-xs"
            onClick={() => {
              onCurrentJobStateChange("resume");
            }}
          >
            Resume print
          </button>
        ) : (
          <button
            className="btn btn-xs"
            onClick={() => {
              onCurrentJobStateChange("pause");
            }}
          >
            Pause print
          </button>
        )}
        <button className="btn btn-xs" onClick={cancelPrintModal.openModal}>
          Cancel print
        </button>
        <CancelPrintModal
          modal={cancelPrintModal}
          onCurrentJobStateChange={onCurrentJobStateChange}
        />
      </div>
    </>
  );
};

const AxesXYControl = ({ movePrinthead }) => {
  // TODO add distance picker
  const [distance] = useState(10);
  return (
    <div className="axes-content">
      <span className="axes-content-title">
        Move on X/Y axis <br />
        by {distance}mm
      </span>
      <div className="axes-content-grid">
        <div style={{ gridColumn: 2, gridRow: 1 }}>
          <BusyButton
            className="btn btn-sm"
            type="button"
            onClick={() => {
              movePrinthead("jog", {
                y: distance,
                absolute: false,
              });
            }}
            busyChildren="o"
          >
            <span className="icon-arrow-up"></span>
          </BusyButton>
        </div>
        <div style={{ gridColumn: 1, gridRow: 2 }}>
          <BusyButton
            className="btn btn-sm"
            type="button"
            onClick={() => {
              movePrinthead("jog", {
                x: -distance,
                absolute: false,
              });
            }}
            busyChildren="o"
          >
            <span className="icon-arrow-left"></span>
          </BusyButton>
        </div>
        <div style={{ gridColumn: 2, gridRow: 2 }}>
          <BusyButton
            className="btn btn-sm"
            type="button"
            onClick={() => {
              movePrinthead("home", {
                axes: ["x", "y"],
              });
            }}
            busyChildren="o"
          >
            <span className="icon-home"></span>
          </BusyButton>
        </div>
        <div style={{ gridColumn: 3, gridRow: 2 }}>
          <BusyButton
            className="btn btn-sm"
            type="button"
            onClick={() => {
              movePrinthead("jog", {
                x: distance,
                absolute: false,
              });
            }}
            busyChildren="o"
          >
            <span className="icon-arrow-right"></span>
          </BusyButton>
        </div>
        <div style={{ gridColumn: 2, gridRow: 3 }}>
          <BusyButton
            className="btn btn-sm"
            type="button"
            onClick={() => {
              movePrinthead("jog", {
                y: -distance,
                absolute: false,
              });
            }}
            busyChildren="o"
          >
            <span className="icon-arrow-down"></span>
          </BusyButton>
        </div>
      </div>
    </div>
  );
};

const AxesZControl = ({ movePrinthead }) => {
  // TODO add distance picker
  const [distance] = useState(10);
  return (
    <div className="axes-content">
      <span className="axes-content-title">
        Move on Z axis <br />
        by {distance}mm
      </span>
      <div className="axes-content-grid">
        <div style={{ gridColumn: 2, gridRow: 1 }}>
          <BusyButton
            className="btn btn-sm"
            type="button"
            onClick={() => {
              movePrinthead("jog", {
                z: distance,
                absolute: false,
              });
            }}
            busyChildren="o"
          >
            <span className="icon-arrow-up"></span>
          </BusyButton>
        </div>
        <div style={{ gridColumn: 2, gridRow: 2 }}>
          <BusyButton
            className="btn btn-sm"
            type="button"
            onClick={() => {
              movePrinthead("home", {
                axes: ["z"],
              });
            }}
            busyChildren="o"
          >
            <span className="icon-home"></span>
          </BusyButton>
        </div>
        <div style={{ gridColumn: 2, gridRow: 3 }}>
          <BusyButton
            className="btn btn-sm"
            type="button"
            onClick={() => {
              movePrinthead("jog", {
                z: -distance,
                absolute: false,
              });
            }}
            busyChildren="o"
          >
            <span className="icon-arrow-down"></span>
          </BusyButton>
        </div>
      </div>
    </div>
  );
};

const ExtrusionControl = ({ extrude }) => {
  const [amount, setAmount] = useState(5);
  return (
    <>
      <label htmlFor="extrusion">Move material by</label>

      <div>
        <input
          name="extrusion"
          id="extrusion"
          type="number"
          value={amount}
          step="1"
          min="0"
          size="3"
          onChange={(e) => {
            setAmount(e.target.value ? parseFloat(e.target.value) : "");
          }}
        />

        <span className="input-appendix">mm</span>

        <BusyButton
          className="btn btn-xs"
          type="button"
          disabled={amount === 0 || amount === ""}
          onClick={() => {
            extrude(amount);
          }}
          busyChildren="Working..."
        >
          Extrude
        </BusyButton>

        <BusyButton
          className="btn btn-xs"
          type="button"
          disabled={amount === 0 || amount === ""}
          onClick={() => {
            extrude(-amount);
          }}
          busyChildren="Working..."
        >
          Retract
        </BusyButton>
      </div>
    </>
  );
};

const PrinterLightsControl = ({ printer, changeLightsState }) => {
  if (!printer || !printer.client || !printer.client.octoprint || !printer.client.octoprint.plugins || !printer.client.octoprint.plugins.includes('awesome_karmen_led')) {
    return null;
  }
  return (
    <>
      <label>Lights</label>
      <div>
        <BusyButton
          className="btn btn-xs"
          type="button"
          onClick={() => changeLightsState(printer.client.octoprint.lights === "on" ? "black" : "white")}
          busyChildren="Switching lights..."
        >
            {printer.client.octoprint.lights === "on" ? "Off" : "On"}
        </BusyButton>

      </div>
    </>
  );
};

const DirectControl = ({
  changeFanState,
  changeMotorsState,
  changeLightsState,
  printer,
}) => {
  return (
    <>
      <label>Fan</label>
      <div>
        <BusyButton
          className="btn btn-xs"
          type="button"
          onClick={() => {
            changeFanState("on");
          }}
          busyChildren="Working..."
        >
          Force ON
        </BusyButton>
        <BusyButton
          className="btn btn-xs"
          type="button"
          onClick={() => {
            changeFanState("off");
          }}
          busyChildren="Working..."
        >
          Force OFF
        </BusyButton>
      </div>

      <label>Motors</label>
      <div>
        <BusyButton
          className="btn btn-xs"
          type="button"
          onClick={() => {
            changeMotorsState("off");
          }}
          busyChildren="Working..."
        >
          Disable
        </BusyButton>
      </div>
      <PrinterLightsControl
        printer={printer}
        changeLightsState={changeLightsState}
      />
    </>
  );
};

const TemperatureControl = ({ name, current, partName, setTemperature }) => {
  const [target, setTarget] = useState(current);
  return (
    <>
      <label htmlFor="extrusion">{name}</label>

      <div>

        <input
          name="extrusion"
          id={"temp-input-"+partName}
          type="number"
          value={target}
          step="0.1"
          min="0"
          onChange={(e) => {
            setTarget(e.target.value ? parseFloat(e.target.value) : "");
          }}
        />

        <span className="input-appendix">°C</span>

        <BusyButton
          className="btn btn-xs"
          type="button"
          disabled={target < 0}
          onClick={() => {
            setTemperature(partName, target);
          }}
          busyChildren="Setting..."
        >
          Set
        </BusyButton>

         <BusyButton
          className="btn btn-xs"
          type="button"
          onClick={() => {
            setTemperature(partName, 0);
            setTarget(0);
          }}
          busyChildren="Setting..."
        >
          Cooldown
        </BusyButton>
      </div>
    </>
  );
};

const ControlsTab = ({
  printer,
  available,
  temperatures,
  movePrinthead,
  changeFanState,
  changeMotorsState,
  changeLights,
  changeCurrentJobState,
  extrude,
  setTemperature,
}) => {
  return (
    <div className="container">
      {(!printer || !printer.client || !printer.client.octoprint || printer.client.octoprint.error) ? (
        <div className="tabs-content-message">
          Controls are not available for a disconnected printer
        </div>
      )
      /* {printer.client &&
        printer.client.connected &&
        printer.client.access_level !== "unlocked" && (
          <div className="tabs-content-message">
            Printer is locked and therefore controls are not available
          </div>
        )} */
        : (printer.client.octoprint.printer.state && printer.client.octoprint.printer.state.flags && printer.client.octoprint.printer.state.flags.operational && (
          <div className="printer-control-panel">
            <div className="controls">
              <PrinterCurrentPrintControl
                printer={printer}
                onCurrentJobStateChange={changeCurrentJobState}
              />

              <DirectControl
                changeFanState={changeFanState}
                changeMotorsState={changeMotorsState}
                changeLightsState={changeLights}
                printer={printer}
              />

              <ExtrusionControl extrude={extrude}/>

              <TemperatureControl
                name="Tool temperature"
                partName="tool0"
                // current={temperatures.tool0 && temperatures.tool0.actual}
                current={0}
                setTemperature={setTemperature}
              />

              <TemperatureControl
                name="Bed temperature"
                partName="bed"
                // current={temperatures.bed && temperatures.bed.actual}
                current={0}
                setTemperature={setTemperature}
              />
            </div>

            <div className="axes">
              <AxesXYControl movePrinthead={movePrinthead}/>
              <AxesZControl movePrinthead={movePrinthead}/>
            </div>
          </div>
        ) || (
          <div className="printer-control-panel">
            <div className="controls">
              <PrinterLightsControl
                printer={printer}
                changeLightsState={changeLights}
              />
            </div>
            <br clear="all"/>
            <p>
              <strong>
                Some controls are not available for a disconnected printer
              </strong>
            </p>
          </div>
        ))}
    </div>
  );
};

export default ControlsTab;
