import React from 'react';
import dayjs from 'dayjs';

import Loader from '../components/loader';
import { BackLink } from '../components/back';
import { getPrinters, getGcodes, deleteGcode, uploadGcode, printGcode } from '../services/karmen-backend';

class GcodeRow extends React.Component {
  state = {
    showDeleteRow: false,
    showPrinterSelectRow: false,
    showPrintStatusRow: false,
    message: '',
    messageOk: false,
    selectedPrinter: null,
    availablePrinters: [],
  }

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
    const { showDeleteRow, showPrinterSelectRow, showPrintStatusRow, availablePrinters, selectedPrinter } = this.state;
    const { display, path, size, uploaded, url, onRowDelete, id } = this.props;
    if (showPrintStatusRow) {
      const { message, messageOk } = this.state;
      return (
        <tr>
          <td colSpan="3">
            {message && <p className={messageOk ? "message-success" : "message-error"}>{message}</p>}
          </td>
          <td className="action-cell">
            <button className="plain" onClick={() => {
              this.setState({
                showPrintStatusRow: false,
              })
            }}><i className="icon icon-cross icon-state-cancel"></i></button>
          </td>
        </tr>
      );
    }
    if (showDeleteRow) {
      return (
        <tr>
          <td colSpan="3">
            Do you really want to delete <strong>{path}/{display}</strong>? This cannot be undone.
          </td>
          <td className="action-cell">
            <button className="plain" onClick={() => {
              this.setState({
                showDeleteRow: false,
              })
            }}><i className="icon icon-cross icon-state-cancel"></i></button>
            <button className="plain" onClick={() => {
              onRowDelete();
            }}><i className="icon icon-checkmark icon-state-confirm"></i></button>
          </td>
        </tr>
      );
    }

    if (showPrinterSelectRow) {
      const availablePrinterOpts = availablePrinters.map((p) => {
        return <option key={p.ip} value={p.ip}>{`${p.name} (${p.ip})`}</option>;
      })
      return (
        <tr>
          <td colSpan="3">
            On which printer would you like to print?{' '}
            <select id="selectedPrinter" name="selectedPrinter" value={selectedPrinter} onChange={(e) => this.setState({
              selectedPrinter: e.target.value,
            })}>
            {availablePrinterOpts}
            </select>
          </td>
          <td className="action-cell">
            <button className="plain" onClick={() => {
              this.setState({
                showPrinterSelectRow: false,
                selectedPrinter: null,
              })
            }}><i className="icon icon-cross icon-state-cancel"></i></button>
            <button className="plain" onClick={() => {
              const { selectedPrinter } = this.state;
              printGcode(id, selectedPrinter)
                .then((r) => {
                  switch(r) {
                    case 201:
                      this.setState({
                        showPrinterSelectRow: false,
                        showPrintStatusRow: true,
                        message: 'Print was scheduled',
                        messageOk: true,
                      });
                      break;
                    default:
                      this.setState({
                        showPrinterSelectRow: false,
                        showPrintStatusRow: true,
                        message: 'Print was not scheduled',
                        messageOk: false,
                      });
                  }
                });
            }}><i className="icon icon-checkmark icon-state-confirm"></i></button>
          </td>
        </tr>
      );
    }

    return (
      <tr>
        <td><a href={`${window.env.BACKEND_BASE}${url}`}>{path}/{display}</a></td>
        <td>{this.formatBytes(size)}</td>
        <td>{dayjs(uploaded).format('HH:mm:ss YYYY-MM-DD')}</td>
        <td className="action-cell">
          <button className="plain icon-link" onClick={() => {
            getPrinters().then((printers) => {
              const availablePrinters = printers && printers
                .sort((p, r) => p.name > r.name ? 1 : -1)
                .filter((p) => p.client && p.client.connected);
              this.setState({
                availablePrinters,
                selectedPrinter: availablePrinters.length ? availablePrinters[0].ip : null,
                showPrinterSelectRow: true,
              });
            })
          }}><i className="icon icon-printer"></i></button>
          <button className="plain icon-link" onClick={() => {
            this.setState({
              showDeleteRow: true,
            })
          }}><i className="icon icon-bin"></i></button>
        </td>
      </tr>
    );
  }
}

class GcodeList extends React.Component {
  state = {
    gcodes: null,
    toUpload: null,
    path: '',
    submitting: false,
    message: null,
    messageOk: false,
  }

  constructor(props) {
    super(props);
    this.loadCodes = this.loadCodes.bind(this);
    this.addCode = this.addCode.bind(this);
  }

  loadCodes() {
    getGcodes().then((gcodes) => {
      this.setState({
        gcodes,
      });
    });
  }

  addCode(e) {
    e.preventDefault();
    const { toUpload, path } = this.state;
    if (!toUpload) {
      this.setState({
        message: 'You need to select a file!',
      });
      return;
    }
    this.setState({
      submitting: true,
      message: null,
      messageOk: false,
    });
    uploadGcode(path, toUpload)
      .then((r) => {
          switch(r) {
            case 201:
              this.setState({
                submitting: false,
                message: 'File uploaded',
                path: '',
                messageOk: true,
              });
              this.loadCodes();
              break;
            case 415:
              this.setState({
                message: 'This does not seem like a G-Code file.',
                submitting: false,
              });
              break;
            default:
              this.setState({
                message: 'Cannot upload G-Code, check server logs',
                submitting: false,
              });
          }
        });
  }

  componentDidMount() {
    this.loadCodes();
  }

  render () {
    const { gcodes, message, messageOk, path, submitting } = this.state;
    if (gcodes === null) {
      return <div><Loader /></div>;
    }
    const gcodeRows = gcodes && gcodes.sort((p, r) => p.name > r.name ? 1 : -1).map((g) => {
      return <GcodeRow
        key={g.id}
        {...g}
        onRowDelete={() => {
          deleteGcode(g.id)
            .then(() => {
              this.loadCodes();
            });
        }} />
    });

    return (
      <div className="gcode-list standalone-page">
        <h1>G-Codes</h1>
        <div>
          <form>
            {message && <p className={messageOk ? "message-success" : "message-error"}>{message}</p>}
            <p>
              <label htmlFor="file">Select your gcode</label>
              <input type="file" name="file" onChange={(e) => {
                this.setState({
                  toUpload: e.target.files[0]
                });
              }} />
            </p>
            <p>
              <label htmlFor="path">Path (optional)</label>
              <input type="text" id="path" name="path" value={path} onChange={(e) => this.setState({
                path: e.target.value
              })} />
            </p>
            <p>
              <button type="submit" onClick={(e) => this.addCode(e)} disabled={submitting}>
                {submitting
                  ? 'Uploading...'
                  : 'Upload G-Code'
                }
              </button>
            </p>
          </form>
        </div>
        <div>
          {(!gcodeRows || gcodeRows.length === 0)
          ? <p className="message-error">No G-Codes found!</p>
          : (
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
          )}
          </div>
      </div>
    );
  }
}

export default GcodeList;