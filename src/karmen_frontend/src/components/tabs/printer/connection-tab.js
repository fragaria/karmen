import React from "react";
import { PrinterConnectionStatus } from "../../printers/printer-data";

const ControlsTab = ({ printer, startUpdate }) => {
  return (
    <div className="container">
      <div className="printer-connection-status">
        <PrinterConnectionStatus printer={printer} startUpdate={startUpdate} />
      </div>
    </div>
  );
};

export default ControlsTab;
