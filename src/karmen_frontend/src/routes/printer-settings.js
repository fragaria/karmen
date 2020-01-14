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
    const { match, getPrinter, patchPrinter } = this.props;
    const printer = getPrinter(match.params.host);
    return patchPrinter(match.params.host, newParameters).then(r => {
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
    const { match, loadPrinter, getPrinter } = this.props;
    if (!getPrinter(match.params.host)) {
      loadPrinter(match.params.host).then(() => {
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
    const { getPrinter, match } = this.props;
    const printer = getPrinter(match.params.host);
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
  state => ({
    getPrinter: host => state.printers.printers.find(p => p.host === host)
  }),
  dispatch => ({
    loadPrinter: host =>
      dispatch(loadPrinter(host, ["job", "status", "webcam"])),
    patchPrinter: (host, data) => dispatch(patchPrinter(host, data))
  })
)(PrinterSettings);
