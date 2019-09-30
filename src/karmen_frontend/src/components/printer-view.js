import React from 'react';
import { Link } from 'react-router-dom';
import BoxedModal from '../components/boxed-modal';
import { deletePrinter } from '../services/karmen-backend';

const BACKEND_BASE_URL = window.env.BACKEND_BASE;

export class WebcamStream extends React.Component {
  state = {
    isOnline: false,
  }
  componentDidMount() {
    const { stream, proxied } = this.props;
    if (!stream && !proxied) {
      this.setState({
        isOnline: false,
      });
      return;
    }
    fetch(stream)
      .then((r) => {
        if (r.status === 200) {
          this.setState({
            isOnline: true,
            source: stream,
          });
        }
      }).catch((e) => {
        const proxiedStream = `${BACKEND_BASE_URL}${proxied}`;
        fetch(proxiedStream)
          .then((r) => {
            if (r.status === 200) {
              this.setState({
                isOnline: true,
                source: proxiedStream,
              });
            }
          }).catch((e) => {
            // pass
          });
      });
  }

  componentWillUnmount() {
    this.setState({
      isOnline: false,
    })
  }

  render() {
    const { flipHorizontal, flipVertical, rotate90 } = this.props;
    const { isOnline, source } = this.state;
    let klass = [];
    if (flipHorizontal) {
      klass.push('flip-horizontal');
    }

    if (flipVertical) {
      klass.push('flip-vertical');
    }

    if (rotate90) {
      klass.push('rotate-90');
    }

    return <div className="webcam-stream">
      {isOnline ?
        <img
          className={klass.join(' ')}
          alt={source}
          src={`${source}?t=${(new Date()).getTime()}`}
        /> :
        <p className="no-stream">
          Stream unavailable
        </p>
      }
    </div>;
  }
}

export const Job = ({ name, completion, printTime, printTimeLeft }) => {
  let approxPrintTimeLeft = printTimeLeft;
  if (!approxPrintTimeLeft && printTime > 0) {
    approxPrintTimeLeft = (printTime / completion) * 100;
  }
  if (approxPrintTimeLeft) {
    let d = new Date(null);
    d.setSeconds(approxPrintTimeLeft)
    approxPrintTimeLeft = `${d.toISOString().substr(11, 2)}h ${d.toISOString().substr(14, 2)}m`;
  }
  return (
    <React.Fragment>
      <p><strong>{name || '-'}</strong></p>
    </React.Fragment>
  );
}

export const Progress = ({ completion, printTime, printTimeLeft }) => {
  let progressBarWidth = {
    width: (printTime > 0 ? completion.toFixed(2) : '0')+'%',
  };
  let approxPrintTimeLeft = printTimeLeft;
  if (!approxPrintTimeLeft && printTime > 0) {
    approxPrintTimeLeft = (printTime / completion) * 100;
  }
  if (approxPrintTimeLeft) {
    let d = new Date(null);
    d.setSeconds(approxPrintTimeLeft)
    approxPrintTimeLeft = `${d.toISOString().substr(11, 2)}h ${d.toISOString().substr(14, 2)}m`;
  }
  return (
    <React.Fragment>
      <div className="progress">
        <div className="progress-detail">
          {printTimeLeft
            ? <React.Fragment>{printTime > 0 ? completion.toFixed(2) : '0'}% ({approxPrintTimeLeft || '?'} remaining)</React.Fragment>
            : <React.Fragment>-</React.Fragment>
          }
        </div>
        <div className="progress-bar" style={progressBarWidth}></div>
      </div>
    </React.Fragment>
  );
}


export const Temperature = ({name, actual, target }) => {
  return <span> {name}: {actual}/{target} &#176;C</span>
}

export const PrinterActions = ({ ip, connected, currentState, onPrinterDelete }) => {
    return (
      <div className="box-actions">
        <h2 className="hidden">Actions</h2>
        <Link to={`/printers/${ip}`}><i className="icon icon-cog"></i></Link>
        <button className="plain" onClick={onPrinterDelete}><i className="icon icon-bin"></i></button>
      </div>
    );
}

export const PrinterState = ({ printer }) => {
  return (
    <div className="printer-state">
      <h2 className="hidden">Current state</h2>
      <div className="tags">
        <span className="tag">{printer.connected ? "Connected" : "Disconnected"}</span>
        <span className="tag">{printer.status.state}</span>
       </div>
      {printer.status.temperature && printer.status.temperature.tool0 && <Temperature name="Tool" {...printer.status.temperature.tool0} />},
      {printer.status.temperature && printer.status.temperature.bed && <Temperature name="Bed" {...printer.status.temperature.bed} />}
      <Job {...printer.job} />
    </div>
  );
}

export const PrinterConnection = ({ printer }) => {
  return (
    <div className="printer-connection">
      <h2 className="hidden">Connection</h2>
      <ul>
          <li><strong>Status</strong>: {printer.client.connected ? 'Active' : 'Inactive'}</li>
          <li><strong>Client</strong>: {printer.client.name} (<code>{JSON.stringify(printer.client.version)}</code>)</li>
          <li><strong>Client IP</strong>: <a href={`http://${printer.ip}`} target="_blank" rel="noopener noreferrer">{printer.ip}</a></li>
          {printer.hostname && <li><strong>Hostname</strong>: <a href={`http://${printer.hostname}`} target="_blank" rel="noopener noreferrer">{printer.hostname}</a></li>}
      </ul>
    </div>
  );
}

export class PrinterView extends React.Component {
  state = {
    showDeleteModal: false,
  }
  render() {
    const { showDeleteModal } = this.state;
    const { printer, onPrinterDelete } = this.props;
    if (showDeleteModal) {
      return (
        <BoxedModal inverse onBack={() => {
          this.setState({
            showDeleteModal: false
          });
        }}>
          <h1>Are you sure?</h1>
            <p>You can add the printer back later by simply adding <code>{printer.ip}</code> again.</p>
            <button type="submit" onClick={() => {
              deletePrinter(printer.ip);
              onPrinterDelete(printer.ip);
            }}>Remove printer</button>
        </BoxedModal>
        );
    }
    return (
      <>
        <div className="stream-wrapper">
          <WebcamStream {...printer.webcam} />
          <Progress {...printer.job} />
        </div>
        <div class="box-details">
          <div className="title">
            <a href={`http://${printer.ip}`} target="_blank" rel="noopener noreferrer">
              <strong>{printer.name}</strong>
            </a>
          </div>
          <PrinterState printer={printer} />
          <PrinterActions ip={printer.ip} connected={printer.client.connected} currentState={printer.status.state} onPrinterDelete={() => {
            this.setState({
              showDeleteModal: true,
            })
          }} />
        </div>
      </>
    );
  }
}

export default PrinterView;