import React from "react";
import { connect } from "react-redux";

import Loader from "../components/utils/loader";
import OrgRoleBasedGateway from "../components/gateways/org-role-based-gateway";
import { PrinterEditForm } from "../components/forms/printer-edit-form";

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
    const { match, patchPrinter, printer } = this.props;
    return patchPrinter(newParameters).then(r => {
      switch (r.status) {
        case 200:
          this.props.history.push(
            `/${match.params.orgslug}/printers/${printer.uuid}`
          );
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
    const { match, printer } = this.props;
    if (!printerLoaded) {
      return (
        <div>
          <Loader />
        </div>
      );
    }
    return (
      <OrgRoleBasedGateway requiredRole="admin">
        <section className="content">
          <div className="container">
            <h1 className="main-title text-center">
              Change properties of {printer.name}
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
                  "",
                note:
                  (printer.printer_props && printer.printer_props.note) || ""
              }}
              onSubmit={this.changePrinter}
              onCancel={() => {
                this.props.history.push(
                  `/${match.params.orgslug}/printers/${printer.uuid}`
                );
              }}
            />
          </div>
        </section>
      </OrgRoleBasedGateway>
    );
  }
}

export default connect(
  (state, ownProps) => ({
    printer: state.printers.printers.find(
      p => p.uuid === ownProps.match.params.uuid
    )
  }),
  (dispatch, ownProps) => ({
    loadPrinter: () =>
      dispatch(
        loadPrinter(ownProps.match.params.orgslug, ownProps.match.params.uuid, [
          "job",
          "status",
          "webcam"
        ])
      ),
    patchPrinter: data =>
      dispatch(
        patchPrinter(
          ownProps.match.params.orgslug,
          ownProps.match.params.uuid,
          data
        )
      )
  })
)(PrinterSettings);
