import React from "react";
import PrinterEditForm from "../../components/forms/printer-edit-form";

const PrinterSettingsForm = ({
  printer,
  onPrinterSettingsChanged,
  onPrinterSettingsCancelled,
}) => {
  return (
    <PrinterEditForm
      defaults={{
        name: printer.name,
        note: printer.note || "",
      }}
      onSubmit={onPrinterSettingsChanged}
      onCancel={onPrinterSettingsCancelled}
    />
  );
};

export default PrinterSettingsForm;
