import React from 'react';
import { connect } from 'react-redux';
import Loader from '../components/loader';
import { getGcode, printGcode } from '../services/backend';
import { loadPrinters } from '../actions/printers';
import formatters from '../services/formatters';

class GcodeDetail extends React.Component {
  state = {
    gcode: null,
    selectedPrinter: '',
    printedOn: [],
    submitting: false,
    message: null,
    messageOk: true,
    showFilamentTypeWarningMessage: false,
    printerFilamentType: '',
    gcodeFilamentType: '',
  }

  constructor(props) {
    super(props);
    this.loadGcode = this.loadGcode.bind(this);
    this.schedulePrint = this.schedulePrint.bind(this);
  }

  loadGcode() {
    const { match } = this.props;
    getGcode(match.params.id, []).then((gcode) => {
      this.setState({
        gcode,
      });
    });
  }

  schedulePrint(gcodeId, printerHost) {
    printGcode(gcodeId, printerHost)
      .then((r) => {
        const { printedOn } = this.state;
        printedOn.push(printerHost)
        switch(r) {
          case 201:
            this.setState({
              submitting: false,
              message: 'Print was scheduled',
              messageOk: true,
              showFilamentTypeWarningMessage: false,
              printedOn: [].concat(printedOn),
            });
            break;
          default:
            this.setState({
              submitting: false,
              message: 'Print was not scheduled',
              messageOk: false,
              showFilamentTypeWarningMessage: false,
            });
        }
      });
  }

  componentDidMount() {
    const { printersLoaded, loadPrinters } = this.props
    if (!printersLoaded) {
      loadPrinters();
    }
    this.loadGcode();
  }

  render() {
    const { gcode, message, messageOk, submitting, printedOn,
      showFilamentTypeWarningMessage, printerFilamentType, gcodeFilamentType
    } = this.state;

    if (!gcode) {
      return <div><Loader /></div>;
    }
    const { getAvailablePrinters } = this.props;
    const availablePrinters = getAvailablePrinters(printedOn);
    let { selectedPrinter } = this.state;
    if (!selectedPrinter) {
      selectedPrinter = availablePrinters.length ? availablePrinters[0].host : '';
    }

    const availablePrinterOpts = availablePrinters.map((p) => {
      return <option key={p.host} value={p.host}>{`${p.name} (${p.host})`}</option>;
    });
    return (
      <div className="printer-detail standalone-page">
        <header>
          <h1 className="title">
            {gcode.display}
          </h1>
        </header>
        <div>
          <div className="printer-info">
            <div>
              <div className="printer-connection">
                <ul>
                    <li><strong>Uploaded by</strong>: {gcode.username}</li>
                    <li><strong>Uploaded at</strong>: {formatters.datetime(gcode.uploaded)}</li>
                    <li><strong>Size</strong>: {formatters.bytes(gcode.size)}</li>
                    <li><strong>Download</strong>: <a href={`${window.env.BACKEND_BASE}${gcode.data}`}>{gcode.path}{gcode.path ? '/' : ''}{gcode.filename}</a></li>
                </ul>
              </div>
              <div className="printer-connection">
                {gcode.analysis && (<>
                  <ul>
                    <li><strong>Sliced with</strong>: {gcode.analysis.slicer ? gcode.analysis.slicer : 'N/A'}</li>
                    {gcode.analysis.time && gcode.analysis.time.estimate_s && <li><strong>Estimated print time</strong>: {formatters.timespan(gcode.analysis.time.estimate_s)}</li>}
                    {gcode.analysis.filament && (
                      <>
                        {gcode.analysis.filament.type && <li><strong>Filament type</strong>: {gcode.analysis.filament.type}</li>}
                        {gcode.analysis.filament.length_mm && <li>
                          <strong>Estimated filament usage</strong>: {`${gcode.analysis.filament.length_mm} mm`}
                          {gcode.analysis.filament.volume_cm3 && <> ({gcode.analysis.filament.volume_cm3} cm<sup>3</sup>)</>}
                        </li>}
                      </>)}
                    {gcode.analysis.temperatures && (
                      <>
                        {gcode.analysis.temperatures.bed_first && <li><strong>Bed - First layer</strong>: {gcode.analysis.temperatures.bed_first} &#176;C</li>}
                        {gcode.analysis.temperatures.bed && <li><strong>Bed</strong>: {gcode.analysis.temperatures.bed} &#176;C</li>}
                        {gcode.analysis.temperatures.tool0_first && <li><strong>Tool - First layer</strong>: {gcode.analysis.temperatures.tool0_first} &#176;C</li>}
                        {gcode.analysis.temperatures.tool0 && <li><strong>Tool</strong>: {gcode.analysis.temperatures.tool0} &#176;C</li>}
                      </>)}
                  </ul>
                </>)}
              <div>
                {!!availablePrinters.length &&
                  <form className="inline-form">
                  {showFilamentTypeWarningMessage
                    ? <div>
                        <p className="message-warning">
                          Are you sure? There seems to be a filament mismatch: Printer has <strong>{printerFilamentType}</strong> configured, but this gcode was sliced for <strong>{gcodeFilamentType}</strong>.
                          <button className="plain" type="submit" onClick={(e) => {
                            e.preventDefault();
                            this.setState({
                              submitting: true,
                            });
                            this.schedulePrint(gcode.id, selectedPrinter);
                          }}
                          disabled={submitting}>{submitting ? "Uploading..." : "Yes, print"}</button>
                          <button type="reset" onClick={(e) => {
                            e.preventDefault();
                            this.setState({
                              submitting: false,
                              showFilamentTypeWarningMessage: false,
                            });
                          }} disabled={submitting}>Cancel</button>
                        </p>
                      </div>
                    : 
                      <div>
                        On which printer would you like to print?{' '}
                        <select id="selectedPrinter" name="selectedPrinter" value={selectedPrinter} onChange={(e) => this.setState({
                          selectedPrinter: e.target.value,
                        })}>
                          {availablePrinterOpts}
                        </select>
                        <button className="plain" type="submit" onClick={(e) => {
                          e.preventDefault();
                          const selected = availablePrinters.find((p) => p.host === selectedPrinter);
                          if (selected && selected.printer_props && selected.printer_props.filament_type &&
                              gcode.analysis && gcode.analysis.filament && gcode.analysis.filament.type &&
                              gcode.analysis.filament.type !== selected.printer_props.filament_type
                            ) {
                            this.setState({
                              showFilamentTypeWarningMessage: true,
                              printerFilamentType: selected.printer_props.filament_type,
                              gcodeFilamentType: gcode.analysis.filament.type,
                            });
                            return;
                          }
                          this.setState({
                            submitting: true,
                          });
                          this.schedulePrint(gcode.id, selectedPrinter);
                        }}
                        disabled={submitting}>{submitting ? "Uploading..." : "Print"}</button>
                        {message && <p className={messageOk ? "message-success" : "message-error"}>{message}</p>}
                      </div>
                  }
                  </form>
                }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(
  state => ({
    printersLoaded: state.printers.printersLoaded,
    getAvailablePrinters: (without=[]) => state.printers.printers
        .filter((p) => p.status && p.status.state === 'Operational')
        .filter((p) => p.client && p.client.connected)
        .filter((p) => p.client && p.client.access_level === 'unlocked')
        .filter((p) => without.indexOf(p.host) === -1)
  }),
  dispatch => ({
    loadPrinters: () => (dispatch(loadPrinters(['status']))),
  })
)(GcodeDetail);
