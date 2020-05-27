import React from "react";
import PrinterEditForm from "../../components/forms/printer-edit-form";

class PrinterSettingsForm extends React.Component {
  constructor(props) {
    super(props);
    this.changePrinter = this.changePrinter.bind(this);
    this.cancelChanges = this.cancelChanges.bind(this);
  }

  changePrinter(newParameters) {
    const { onPrinterSettingsChanged } = this.props;
    return onPrinterSettingsChanged(newParameters);
  }

  cancelChanges() {
    const { onPrinterSettingsCancelled } = this.props;

    if (onPrinterSettingsCancelled) {
      return onPrinterSettingsCancelled();
    }
  }

  componentDidMount() {}

  render() {
    const { printer } = this.props;

    return (
      <PrinterEditForm
        defaults={{
          name: printer.name,
          filament_type:
            (printer.printer_props &&
              printer.printer_props.filament_type) ||
            "",
          filament_color:
            (printer.printer_props &&
              printer.printer_props.filament_color) ||
            "",
          bed_type:
            (printer.printer_props && printer.printer_props.bed_type) ||
            "",
          tool0_diameter:
            (printer.printer_props &&
              printer.printer_props.tool0_diameter) ||
            "",
          note:
            (printer.printer_props && printer.printer_props.note) || "",
        }}
        onSubmit={this.changePrinter}
        onCancel={this.cancelChanges}
      />
    );
  }
}

export default PrinterSettingsForm;
