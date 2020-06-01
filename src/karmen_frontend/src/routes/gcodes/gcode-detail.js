import React from "react";
import { Redirect, Link } from "react-router-dom";
import { connect } from "react-redux";
import SetActiveOrganization from "../../components/gateways/set-active-organization";
import Loader from "../../components/utils/loader";
import { usePrintGcodeModal } from "../../components/gcodes/print-gcode-modal";

import { loadGcode, loadPrinters, addPrintJob } from "../../actions";
import formatters from "../../services/formatters";

const BASE_URL = window.env.BACKEND_BASE;

const GcodePrint = ({
  gcode,
  printGcode,
  onSchedulePrint,
  availablePrinters,
}) => {
  const printModal = usePrintGcodeModal({
    gcode,
    printGcode,
    onSchedulePrint,
    availablePrinters,
  });
  return (
    <>
      <button
        className="btn"
        onClick={(e) => {
          printModal.openModal(e);
        }}
      >
        Print g-code
      </button>
      <printModal.Modal />
    </>
  );
};

class GcodeDetail extends React.Component {
  state = {
    gcode: null,
    downloadUrl: null,
    gcodeLoaded: false,
    selectedPrinter: "",
    printedOn: [],
    submitting: false,
    message: null,
    messageOk: true,
    showFilamentTypeWarningMessage: false,
    printerFilamentType: "",
    gcodeFilamentType: "",
  };

  constructor(props) {
    super(props);
    this.loadGcode = this.loadGcode.bind(this);
  }

  loadGcode() {
    const { match, getGcode } = this.props;
    getGcode(match.params.uuid, []).then((r) => {
      let downloadPath = r.data.data;
      if (downloadPath[0] === "/") downloadPath = downloadPath.substr(1);
      this.setState({
        gcode: r.data,
        downloadUrl: `${BASE_URL}/${downloadPath}`,
        gcodeLoaded: true,
      });
    });
  }

  componentDidMount() {
    const { printersLoaded, loadPrinters } = this.props;
    if (!printersLoaded) {
      loadPrinters();
    }
    this.loadGcode();
  }

  render() {
    const { gcode, gcodeLoaded, printedOn } = this.state;
    const { match, printGcode } = this.props;

    if (!gcodeLoaded) {
      return (
        <div>
          <SetActiveOrganization />
          <Loader />
        </div>
      );
    }
    if (!gcode) {
      return <Redirect to="/page-404" />;
    }
    const { getAvailablePrinters } = this.props;
    const availablePrinters = getAvailablePrinters(printedOn);
    let { selectedPrinter } = this.state;
    if (!selectedPrinter) {
      selectedPrinter = availablePrinters.length
        ? availablePrinters[0].uuid
        : "";
    }

    return (
      <section className="content">
        <div className="container">
          <h1 className="main-title">{gcode.display}</h1>
          <dl className="dl-horizontal">
            <dt className="term">Uploaded by: </dt>
            <dd className="description">{gcode.username}</dd>

            <dt className="term">Uploaded at: </dt>
            <dd className="description">
              {formatters.datetime(gcode.uploaded)}
            </dd>

            <dt className="term">Size: </dt>
            <dd className="description">{formatters.bytes(gcode.size)}</dd>

            {gcode.analysis && (
              <>
                <dt className="term">Sliced with: </dt>
                <dd className="description">
                  {gcode.analysis.slicer ? gcode.analysis.slicer : "N/A"}
                </dd>

                {gcode.analysis.time && gcode.analysis.time.estimate_s && (
                  <>
                    <dt className="term">Estimated print time: </dt>
                    <dd className="description">
                      {formatters.timespan(gcode.analysis.time.estimate_s)}
                    </dd>
                  </>
                )}

                {gcode.analysis.filament && (
                  <>
                    {gcode.analysis.filament.type && (
                      <>
                        <dt className="term">Filament type: </dt>
                        <dd className="description">
                          {gcode.analysis.filament.type}
                        </dd>
                      </>
                    )}

                    {gcode.analysis.filament.length_mm && (
                      <>
                        <dt className="term">Estimated filament usage: </dt>
                        <dd className="description">
                          {`${gcode.analysis.filament.length_mm} mm`}
                          {gcode.analysis.filament.volume_cm3 && (
                            <>
                              {" "}
                              ({gcode.analysis.filament.volume_cm3} cm
                              <sup>3</sup>)
                            </>
                          )}
                        </dd>
                      </>
                    )}
                  </>
                )}

                {gcode.analysis.temperatures && (
                  <>
                    {gcode.analysis.temperatures.bed_first && (
                      <>
                        <dt className="term">Bed - First layer: </dt>
                        <dd className="description">
                          {gcode.analysis.temperatures.bed_first}&#176; C
                        </dd>
                      </>
                    )}

                    {gcode.analysis.temperatures.bed && (
                      <>
                        <dt className="term">Bed: </dt>
                        <dd className="description">
                          {gcode.analysis.temperatures.bed}&#176; C
                        </dd>
                      </>
                    )}

                    {gcode.analysis.temperatures.tool0_first && (
                      <>
                        <dt className="term">Tool - First layer: </dt>
                        <dd className="description">
                          {gcode.analysis.temperatures.tool0_first}&#176; C
                        </dd>
                      </>
                    )}

                    {gcode.analysis.temperatures.tool0 && (
                      <>
                        <dt className="term">Tool: </dt>
                        <dd className="description">
                          {gcode.analysis.temperatures.tool0}&#176; C
                        </dd>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </dl>

          <div className="cta-box text-center">
            <GcodePrint
              gcode={gcode}
              printGcode={printGcode}
              onSchedulePrint={(gcodeId, printerUuid) => {
                return printGcode(gcodeId, printerUuid).then((r) => {
                  printedOn.push(printerUuid);
                  this.setState({
                    printedOn: [].concat(printedOn),
                  });
                  return r;
                });
              }}
              availablePrinters={getAvailablePrinters(printedOn)}
            />
          </div>

          <div className="cta-box text-center">
            <a href={this.state.downloadUrl} download className="btn">
              Download G-code
            </a>
          </div>

          <div className="cta-box text-center">
            <Link
              to={`/${match.params.orguuid}/gcodes`}
              className="btn btn-plain"
            >
              Back to listing
            </Link>
          </div>
        </div>
      </section>
    );
  }
}

export default connect(
  (state) => ({
    printersLoaded: state.printers.printersLoaded,
    getAvailablePrinters: (without = []) =>
      state.printers.printers
        .filter((p) => p.status && p.status.state === "Operational")
        .filter((p) => p.client && p.client.connected)
        .filter((p) => p.client && p.client.access_level === "unlocked")
        .filter((p) => without.indexOf(p.uuid) === -1),
  }),
  (dispatch, ownProps) => ({
    loadPrinters: () =>
      dispatch(
        loadPrinters(ownProps.match.params.orguuid, [
          "job",
          "status",
          "webcam",
          "lights",
        ])
      ),
    getGcode: (id) =>
      dispatch(loadGcode(ownProps.match.params.orguuid, id, [])),
    printGcode: (id, printer) =>
      dispatch(addPrintJob(ownProps.match.params.orguuid, id, printer)),
  })
)(GcodeDetail);
