import React from 'react';

import Loader from '../components/loader';
import { getGcode, getPrinters, printGcode } from '../services/karmen-backend';
import formatters from '../services/formatters';

class GcodeDetail extends React.Component {
  state = {
    gcode: null,
    selectedPrinter: null,
    availablePrinters: [],
    message: null,
    messageOk: true,
  }

  constructor(props) {
    super(props);
    this.loadGcode = this.loadGcode.bind(this);
    this.loadPrinters = this.loadPrinters.bind(this);
  }

  loadGcode() {
    const { match } = this.props;
    getGcode(match.params.id, []).then((gcode) => {
      this.setState({
        gcode,
      });
    });
  }

  loadPrinters() {
    getPrinters().then((printers) => {
      const availablePrinters = printers && printers
        .sort((p, r) => p.name > r.name ? 1 : -1)
        .filter((p) => p.client && p.client.connected);
      this.setState({
        availablePrinters,
        selectedPrinter: availablePrinters.length ? availablePrinters[0].ip : null,
      });
    })
  }

  componentDidMount() {
    this.loadGcode();
    this.loadPrinters();
  }

  render() {
    const { gcode, availablePrinters, selectedPrinter, message, messageOk } = this.state;
    if (!gcode) {
      return <div><Loader /></div>;
    }
    const availablePrinterOpts = availablePrinters.map((p) => {
      return <option key={p.ip} value={p.ip}>{`${p.name} (${p.ip})`}</option>;
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
                    <li><strong>Uploaded</strong>: {formatters.datetime(gcode.uploaded)}</li>
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
                {availablePrinters.length && 
                  <form className="inline-form">
                    <div>
                      On which printer would you like to print?{' '}
                      <select id="selectedPrinter" name="selectedPrinter" value={selectedPrinter} onChange={(e) => this.setState({
                        selectedPrinter: e.target.value,
                      })}>
                        {availablePrinterOpts}
                      </select>
                      <button className="plain" type="submit" onClick={(e) => {
                        e.preventDefault();
                        const { selectedPrinter } = this.state;
                        printGcode(gcode.id, selectedPrinter)
                          .then((r) => {
                            switch(r) {
                              case 201:
                                this.setState({
                                  message: 'Print was scheduled',
                                  messageOk: true,
                                });
                                break;
                              default:
                                this.setState({
                                  message: 'Print was not scheduled',
                                  messageOk: false,
                                });
                            }
                          });
                      }}>Print</button>
                    </div>
                    {message && <p className={messageOk ? "message-success" : "message-error"}>{message}</p>}
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

export default GcodeDetail;
