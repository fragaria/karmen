import React from "react";
import PrinterSettingsForm from "../../printers/printer-settings";

const SettingsTab = ({ printer, match, onPrinterSettingsChanged }) => {
  return (
    <div className="container">
      <div className="printer-settings">
        <PrinterSettingsForm
          printer={printer}
          onPrinterSettingsChanged={onPrinterSettingsChanged}
        />
      </div>
    </div>
  );
};

export default SettingsTab;
