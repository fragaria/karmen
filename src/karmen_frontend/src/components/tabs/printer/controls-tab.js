import React from "react";
import BusyButton from "../../utils/busy-button";

const ControlsTab = ({ printerControl }) => {
  return (
    <div className="container">
      <div className="printer-control-panel">
        <div style={{ gridColumn: 2, gridRow: 1 }}>X/Y</div>
        <div style={{ gridColumn: 2, gridRow: 2 }}>
          <BusyButton
            className="btn btn-sm"
            type="button"
            onClick={printerControl}
            busyChildren="..."
          >
            <span className="icon-up1"></span>
          </BusyButton>
        </div>
        <div style={{ gridColumn: 1, gridRow: 3 }}>
          <BusyButton
            className="btn btn-sm"
            type="button"
            onClick={printerControl}
            busyChildren="..."
          >
            <span className="icon-left"></span>
          </BusyButton>
        </div>
        <div style={{ gridColumn: 2, gridRow: 3 }}>
          <BusyButton
            className="btn btn-sm"
            type="button"
            onClick={printerControl}
            busyChildren="..."
          >
            <span className="icon-home"></span>
          </BusyButton>
        </div>
        <div style={{ gridColumn: 3, gridRow: 3 }}>
          <BusyButton
            className="btn btn-sm"
            type="button"
            onClick={printerControl}
            busyChildren="..."
          >
            <span className="icon-right"></span>
          </BusyButton>
        </div>

        <div style={{ gridColumn: 2, gridRow: 4 }}>
          <BusyButton
            className="btn btn-sm"
            type="button"
            onClick={printerControl}
            busyChildren="..."
          >
            <span className="icon-down1"></span>
          </BusyButton>
        </div>

        <div style={{ gridColumn: 4, gridRow: 1 }}>Z</div>
        <div style={{ gridColumn: 4, gridRow: 2 }}>
          <BusyButton
            className="btn btn-sm"
            type="button"
            onClick={printerControl}
            busyChildren="..."
          >
            <span className="icon-up1"></span>
          </BusyButton>
        </div>
        <div style={{ gridColumn: 4, gridRow: 3 }}>
          <BusyButton
            className="btn btn-sm"
            type="button"
            onClick={printerControl}
            busyChildren="..."
          >
            <span className="icon-home"></span>
          </BusyButton>
        </div>
        <div style={{ gridColumn: 4, gridRow: 4 }}>
          <BusyButton
            className="btn btn-sm"
            type="button"
            onClick={printerControl}
            busyChildren="..."
          >
            <span className="icon-down1"></span>
          </BusyButton>
        </div>

        <div
          style={{
            gridColumn: 5,
            gridRow: 1,
            gridColumnEnd: 7,
            height: 0
          }}
        >
          Extrude
        </div>
        <div
          style={{
            gridColumn: 5,
            gridRow: 2,
            gridColumnEnd: 7,
            height: 0
          }}
        >
          <BusyButton
            className="btn btn-sm"
            type="button"
            onClick={printerControl}
            busyChildren="..."
          >
            <span className="icon-up1"></span>
          </BusyButton>
        </div>
        <div
          style={{
            gridColumn: 5,
            gridRow: 3,
            gridColumnEnd: 7,
            height: 0
          }}
        >
          <input style={{ maxWidth: 50 }} type="number" value="1" />
        </div>
        <div
          style={{
            gridColumn: 5,
            gridRow: 4,
            gridColumnEnd: 7,
            height: 0
          }}
        >
          <BusyButton
            className="btn btn-sm"
            type="button"
            onClick={printerControl}
            busyChildren="..."
          >
            <span className="icon-down1"></span>
          </BusyButton>
        </div>

        <div style={{ gridColumn: 4, gridRow: 1 }}>Z</div>
        <div style={{ gridColumn: 4, gridRow: 2 }}>
          <BusyButton
            className="btn btn-sm"
            type="button"
            onClick={printerControl}
            busyChildren="..."
          >
            <span className="icon-up1"></span>
          </BusyButton>
        </div>
        <div style={{ gridColumn: 4, gridRow: 3 }}>
          <BusyButton
            className="btn btn-sm"
            type="button"
            onClick={printerControl}
            busyChildren="..."
          >
            <span className="icon-home"></span>
          </BusyButton>
        </div>
        <div style={{ gridColumn: 4, gridRow: 4 }}>
          <BusyButton
            className="btn btn-sm"
            type="button"
            onClick={printerControl}
            busyChildren="..."
          >
            <span className="icon-down1"></span>
          </BusyButton>
        </div>

        <div style={{ gridColumn: 7, gridRow: 1 }}>Fan</div>
        <div style={{ gridColumn: 7, gridRow: 2 }}>
          <BusyButton
            className="btn btn-sm"
            type="button"
            onClick={printerControl}
            busyChildren="..."
          >
            ON
          </BusyButton>
        </div>

        <div style={{ gridColumn: 7, gridRow: 4 }}>
          <BusyButton
            className="btn btn-sm"
            type="button"
            onClick={printerControl}
            busyChildren="..."
          >
            OFF
          </BusyButton>
        </div>

        <div
          style={{
            gridColumn: 1,
            gridRow: 6,
            gridColumnEnd: 4,
            height: 0
          }}
        >
          <span>Bed temp</span>
        </div>
        <div
          style={{
            gridColumn: 4,
            gridRow: 6,
            gridColumnEnd: 7,
            height: 0
          }}
        >
          <input type="number" style={{ width: "100%" }} />
        </div>
        <div style={{ gridColumn: 7, gridRow: 6 }}>
          <BusyButton
            className="btn btn-sm"
            type="button"
            onClick={printerControl}
            busyChildren="..."
          >
            SET
          </BusyButton>
        </div>

        <div
          style={{
            gridColumn: 1,
            gridRow: 7,
            gridColumnEnd: 4,
            height: 0
          }}
        >
          <span>Hotend temp</span>
        </div>
        <div
          style={{
            gridColumn: 4,
            gridRow: 7,
            gridColumnEnd: 7,
            height: 0
          }}
        >
          <input type="number" style={{ width: "100%" }} />
        </div>
        <div style={{ gridColumn: 7, gridRow: 7 }}>
          <BusyButton
            className="btn btn-sm"
            type="button"
            onClick={printerControl}
            busyChildren="..."
          >
            SET
          </BusyButton>
        </div>
      </div>
    </div>
  );
};

export default ControlsTab;
