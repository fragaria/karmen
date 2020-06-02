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
        filament_type:
          (printer.printer_props && printer.printer_props.filament_type) || "",
        filament_color:
          (printer.printer_props && printer.printer_props.filament_color) || "",
        bed_type:
          (printer.printer_props && printer.printer_props.bed_type) || "",
        tool0_diameter:
          (printer.printer_props && printer.printer_props.tool0_diameter) || "",
        note: (printer.printer_props && printer.printer_props.note) || "",
      }}
      onSubmit={this.onPrinterSettingsChanged}
      onCancel={this.onPrinterSettingsCancelled}
    />
  );
};

export default PrinterSettingsForm;
