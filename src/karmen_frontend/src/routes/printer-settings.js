import React from "react";
import { connect } from "react-redux";

import Loader from "../components/loader";
import RoleBasedGateway from "../components/role-based-gateway";
import { PrinterEditForm } from "../components/printer-edit-form";

import { loadPrinter, patchPrinter } from "../actions/printers";

class PrinterSettings extends React.Component {
  state = {
    printerLoaded: false
  };

  constructor(props) {
    super(props);
    this.changePrinter = this.changePrinter.bind(this);
  }

  changePrinter(newParameters) {
    const { patchPrinter, printer } = this.props;
    // TODO reflect this optimistically into redux
    return patchPrinter(newParameters).then(r => {
      switch (r.status) {
        case 200:
          this.props.history.push(`/printers/${printer.host}`);
          return {
            ok: true,
            message: "Changes saved successfully"
          };
        default:
          return {
            ok: false,
            message: "Cannot save your changes, check server logs"
          };
      }
    });
  }

  componentDidMount() {
    const { loadPrinter, printer } = this.props;
    if (!printer) {
      loadPrinter().then(() => {
        this.setState({
          printerLoaded: true
        });
      });
    } else {
      this.setState({
        printerLoaded: true
      });
    }
  }

  render() {
    const { printerLoaded } = this.state;
    const { printer } = this.props;
    if (!printerLoaded) {
      return (
        <div>
          <Loader />
        </div>
      );
    }
    return (
      <RoleBasedGateway requiredRole="admin">
        <section className="content">
          <div className="container">
            <h1 className="main-title text-center">
              Change properties of {printer.host}
            </h1>
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
                  ""
              }}
              onSubmit={this.changePrinter}
              onCancel={() => {
                this.props.history.push(`/printers/${printer.host}`);
              }}
            />
          </div>
        </section>
      </RoleBasedGateway>
    );
  }
}

export default connect(
  (state, ownProps) => ({
    printer: state.printers.printers.find(
      p => p.host === ownProps.match.params.host
    )
  }),
  (dispatch, ownProps) => ({
    loadPrinter: () =>
      dispatch(
        loadPrinter(ownProps.match.params.host, ["job", "status", "webcam"])
      ),
    patchPrinter: data =>
      dispatch(patchPrinter(ownProps.match.params.host, data))
  })
)(PrinterSettings);
