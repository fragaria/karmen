import React from "react";
import { PrinterConnectionStatus } from "../../printers/printer-data";

const ControlsTab = ({ printer }) => {
  return (
    <div className="container">
      <PrinterConnectionStatus printer={printer} />
    </div>
  );
};

export default ControlsTab;
