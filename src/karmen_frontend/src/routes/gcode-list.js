import React from 'react';

import Loader from '../components/loader';
import { BackLink } from '../components/back';
import { getGcodes } from '../services/karmen-backend';

class GcodeRow extends React.Component {
  // props to https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  render() {
    const { display, size, uploaded, url } = this.props;
    const localTime = new Date(uploaded);
    return (
      <tr>
        <td><a href={`${window.env.BACKEND_BASE}${url}`}>{display}</a></td>
        <td>{this.formatBytes(size)}</td>
        <td>{localTime.toString()}</td>
        <td></td>
      </tr>
    );
  }
}

class GcodeList extends React.Component {
  state = {
    gcodes: null,
  }

  componentDidMount() {
    getGcodes().then((gcodes) => {
      this.setState({
        gcodes,
      });
    });
  }

  render () {
    const { gcodes } = this.state;
    if (gcodes === null) {
      return <div><Loader /></div>;
    }
    const gcodeRows = gcodes && gcodes.sort((p, r) => p.name > r.name ? 1 : -1).map((g) => {
      return <GcodeRow key={g.display} display={g.display} id={g.id} size={g.size} uploaded={g.uploaded} url={g.data} />
    });
    return (
      <div className="gcode-list standalone-page">
        <BackLink to="/" />
        <h1>Stored G-Codes</h1>
        {(!gcodeRows || gcodeRows.length === 0) && <p>No G-codes found!</p>}
        <table>
          <thead>
            <tr>
              <th>File</th>
              <th>Size</th>
              <th>Uploaded at</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {gcodeRows}
          </tbody>
          </table>
      </div>
    );
  }
}

export default GcodeList;