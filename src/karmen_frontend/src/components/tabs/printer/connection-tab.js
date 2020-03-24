import React from "react";
import { PrinterConnectionStatus } from "../../printers/printer-data";

const ControlsTab = ({ printer }) => {
  return (
    <div className="container">
      <div className="printer-connection-status">
        <PrinterConnectionStatus printer={printer} />
      </div>
    </div>
  );
};

export default ControlsTab;
