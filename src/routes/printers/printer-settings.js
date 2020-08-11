import React from "react";
import { connect } from "react-redux";
import SetActiveOrganization from "../../components/gateways/set-active-organization";
import Loader from "../../components/utils/loader";
import OrgRoleBasedGateway from "../../components/gateways/org-role-based-gateway";
import PrinterSettingsForm from "../../components/printers/printer-settings";

import { loadPrinter, patchPrinter } from "../../actions";

class PrinterSettings extends React.Component {
  state = {
    printerLoaded: false,
  };

  constructor(props) {
    super(props);
    this.changePrinter = this.changePrinter.bind(this);
  }

  changePrinter(newParameters) {
    const { match, patchPrinter, printer } = this.props;
    return patchPrinter(newParameters)
      .then(() => {
        this.props.history.push(
          `/${match.params.orguuid}/printers/${printer.uuid}`
        );
        return {
          ok: true,
          message: "Changes saved successfully",
        };
      })
      .catch((err) => {
        return {
          ok: false,
          message: "Your changes could not be saved due to a server error.",
        };
      });
  }

  componentDidMount() {
    const { loadPrinter, printer } = this.props;
    if (!printer) {
      loadPrinter().then(() =>
        this.setState({
          printerLoaded: true,
        })
      );
    } else {
      this.setState({
        printerLoaded: true,
      });
    }
  }

  render() {
    const { printerLoaded } = this.state;
    const { match, printer, patchPrinter } = this.props;
    if (!printerLoaded) {
      return (
        <div>
          <SetActiveOrganization />
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

            <PrinterSettingsForm
              printer={printer}
              onPrinterSettingsChanged={patchPrinter}
              onPrinterSettingsCancelled={() => {
                this.props.history.push(
                  `/${match.params.orguuid}/printers/${printer.uuid}`
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
      (p) => p.uuid === ownProps.match.params.uuid
    ),
  }),
  (dispatch, ownProps) => ({
    loadPrinter: () =>
      dispatch(
        loadPrinter(ownProps.match.params.orguuid, ownProps.match.params.uuid, [
          "job",
          "status",
          "webcam",
          "lights",
        ])
      ),
    patchPrinter: (data) =>
      dispatch(
        patchPrinter(
          ownProps.match.params.orguuid,
          ownProps.match.params.uuid,
          data
        )
      ),
  })
)(PrinterSettings);
