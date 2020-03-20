import React, { useState } from "react";
import BusyButton from "../../utils/busy-button";

const AxesXYControl = ({ movePrinthead }) => {
  // TODO add distance picker
  const [distance] = useState(10);
  return (
    <div>
      <p>Move X/Y by {distance}mm</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridGap: "5px"
        }}
      >
        <div style={{ gridColumn: 2, gridRow: 1 }}>
          <BusyButton
            className="btn btn-sm"
            type="button"
            onClick={() => {
              movePrinthead("jog", {
                y: distance,
                absolute: false
              });
            }}
            busyChildren="o"
          >
            <span className="icon-up1"></span>
          </BusyButton>
        </div>
        <div style={{ gridColumn: 1, gridRow: 2 }}>
          <BusyButton
            className="btn btn-sm"
            type="button"
            onClick={() => {
              movePrinthead("jog", {
                x: -distance,
                absolute: false
              });
            }}
            busyChildren="o"
          >
            <span className="icon-left"></span>
          </BusyButton>
        </div>
        <div style={{ gridColumn: 2, gridRow: 2 }}>
          <BusyButton
            className="btn btn-sm"
            type="button"
            onClick={() => {
              movePrinthead("home", {
                axes: ["x", "y"]
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
                absolute: false
              });
            }}
            busyChildren="o"
          >
            <span className="icon-right"></span>
          </BusyButton>
        </div>

        <div style={{ gridColumn: 2, gridRow: 3 }}>
          <BusyButton
            className="btn btn-sm"
            type="button"
            onClick={() => {
              movePrinthead("jog", {
                y: -distance,
                absolute: false
              });
            }}
            busyChildren="o"
          >
            <span className="icon-down1"></span>
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
    <div>
      <p>Move Z by {distance}mm</p>
      <div>
        <BusyButton
          className="btn btn-sm"
          type="button"
          onClick={() => {
            movePrinthead("jog", {
              z: distance,
              absolute: false
            });
          }}
          busyChildren="o"
        >
          <span className="icon-up1"></span>
        </BusyButton>
      </div>
      <div>
        <BusyButton
          className="btn btn-sm"
          type="button"
          onClick={() => {
            movePrinthead("home", {
              axes: ["z"]
            });
          }}
          busyChildren="o"
        >
          <span className="icon-home"></span>
        </BusyButton>
      </div>
      <div>
        <BusyButton
          className="btn btn-sm"
          type="button"
          onClick={() => {
            movePrinthead("jog", {
              z: -distance,
              absolute: false
            });
          }}
          busyChildren="o"
        >
          <span className="icon-down1"></span>
        </BusyButton>
      </div>
    </div>
  );
};

const ExtrusionControl = ({ extrude }) => {
  const [amount, setAmount] = useState(5);
  return (
    <div>
      <label htmlFor="extrusion">Extrude or retract material (mm)</label>
      <input
        name="extrusion"
        id="extrusion"
        type="number"
        value={amount}
        step="0.1"
        min="0"
        onChange={e => {
          setAmount(e.target.value ? parseFloat(e.target.value) : "");
        }}
      />
      <BusyButton
        className="btn btn-sm"
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
        className="btn btn-sm"
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
  );
};

const DirectControl = ({ changeFanState, changeMotorsState }) => {
  return (
    <div>
      <BusyButton
        className="btn btn-sm"
        type="button"
        onClick={() => {
          changeFanState("on");
        }}
        busyChildren="Working..."
      >
        Fan on
      </BusyButton>
      <BusyButton
        className="btn btn-sm"
        type="button"
        onClick={() => {
          changeFanState("off");
        }}
        busyChildren="Working..."
      >
        Fan off
      </BusyButton>
      <BusyButton
        className="btn btn-sm"
        type="button"
        onClick={() => {
          changeMotorsState("off");
        }}
        busyChildren="Working..."
      >
        Motors off
      </BusyButton>
    </div>
  );
};

const TemperatureControl = ({ name, current, partName, setTemperature }) => {
  const [target, setTarget] = useState(current);
  return (
    <div>
      <label htmlFor="extrusion">
        {name} (current {current}°C)
      </label>
      <input
        name="extrusion"
        id="extrusion"
        type="number"
        value={target}
        step="0.1"
        min="0"
        onChange={e => {
          setTarget(e.target.value ? parseFloat(e.target.value) : "");
        }}
      />
      <BusyButton
        className="btn btn-sm"
        type="button"
        disabled={target === 0}
        onClick={() => {
          setTemperature(partName, target);
        }}
        busyChildren="Setting..."
      >
        Set
      </BusyButton>
    </div>
  );
};

const ControlsTab = ({
  available,
  temperatures,
  movePrinthead,
  changeFanState,
  changeMotorsState,
  extrude,
  setTemperature
}) => {
  return (
    <div className="container">
      {!available ? (
        <p className="message-error">
          Controls are not available for a disconnected printer
        </p>
      ) : (
        <div className="printer-control-panel">
          <div className="axes">
            <AxesXYControl movePrinthead={movePrinthead} />
            <AxesZControl movePrinthead={movePrinthead} />
          </div>
          <div>
            <DirectControl
              changeFanState={changeFanState}
              changeMotorsState={changeMotorsState}
            />
          </div>
          <div>
            <ExtrusionControl extrude={extrude} />
            <TemperatureControl
              name="Tool temperature"
              partName="tool0"
              current={temperatures.tool0 && temperatures.tool0.actual}
              setTemperature={setTemperature}
            />
            <TemperatureControl
              name="Bed temperature"
              partName="bed"
              current={temperatures.bed && temperatures.bed.actual}
              setTemperature={setTemperature}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlsTab;
