import React from 'react';

import Loader from '../components/loader';
import { getGcode } from '../services/karmen-backend';
import formatters from '../services/formatters';

class GcodeDetail extends React.Component {
  state = {
    gcode: null,
  }

  constructor(props) {
    super(props);
    this.loadGcode = this.loadGcode.bind(this);
  }

  loadGcode() {
    const { match } = this.props;
    getGcode(match.params.id, []).then((gcode) => {
      this.setState({
        gcode,
      });
    });
  }

  componentDidMount() {
    this.loadGcode();
  }

  render() {
    const { gcode } = this.state;
    if (!gcode) {
      return <div><Loader /></div>;
    }
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
                  <h2>G-Code analysis</h2>
                  <ul>
                    <li><strong>Sliced with</strong>: {gcode.analysis.slicer ? gcode.analysis.slicer : 'N/A'}</li>
                    {gcode.analysis.time && <li><strong>Estimated print time</strong>: {formatters.timespan(gcode.analysis.time.estimate_s)}</li>}
                    {gcode.analysis.filament && (
                      <>
                        {gcode.analysis.filament.type && <li><strong>Filament type</strong>: {gcode.analysis.filament.type}</li>}
                        {gcode.analysis.filament.length_mm && <li><strong>Estimated filament usage (mm)</strong>: {`${gcode.analysis.filament.length_mm} mm`}</li>}
                        {gcode.analysis.filament.volume_cm3 && <li><strong>Estimated filament usage (cm3)</strong>: {gcode.analysis.filament.volume_cm3} cm<sup>3</sup></li>}
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
              {/*Print, Delete*/}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default GcodeDetail;
