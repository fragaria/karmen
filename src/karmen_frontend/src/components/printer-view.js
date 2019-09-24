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
          <i className="icon icon-warning"></i><br />
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
    approxPrintTimeLeft = `${d.toISOString().substr(11, 2)} hours, ${d.toISOString().substr(14, 2)} minutes`;
  }
  return (
    <React.Fragment>
      <p><i className="icon icon-file-text2"></i> <strong>{name || '-'}</strong></p>
      <p><i className="icon icon-clock"></i>{' '}
        {printTimeLeft
          ? <React.Fragment>{approxPrintTimeLeft || '?'} remaining, {printTime > 0 ? completion.toFixed(2) : '0'}% completed</React.Fragment>
          : <React.Fragment>-</React.Fragment>
        }
      </p>
    </React.Fragment>
  );
}

export const Temperature = ({name, actual, target }) => {
  return <p><i className="icon icon-meter"></i> {name}: {actual}/{target} &#176;C</p>
}

export const PrinterActions = ({ ip, connected, currentState, onPrinterDelete }) => {
    return (
      <div className="box-actions">
        <h2 className="hidden">Actions</h2>
        <ul>
          <li>
            <a href={`http://${ip}`} target="_blank" rel="noopener noreferrer">
              <i className={`icon icon-display ${connected ? 'icon-active' : 'icon-inactive'}`}></i>
            </a>
          </li>
          <li>
            <i className={`icon icon-printer ${currentState === 'Printing' ? 'icon-active' : 'icon-idle'}`} title={currentState}></i>
          </li>
          <li><Link to={`/printers/${ip}`}><i className="icon icon-cog"></i></Link></li>
          <li><button className="plain" onClick={onPrinterDelete}><i className="icon icon-bin"></i></button></li>
        </ul>
      </div>
    );
}

export const PrinterState = ({ printer }) => {
  return (
    <div className="printer-state">
      <h2 className="hidden">Current state</h2>
      <div>
        {printer.status.temperature && printer.status.temperature.tool0 && <Temperature name="Tool" {...printer.status.temperature.tool0} />}
        {printer.status.temperature && printer.status.temperature.bed && <Temperature name="Bed" {...printer.status.temperature.bed} />}
        <Job {...printer.job} />
      </div>
    </div>
  );
}

export const PrinterConnection = ({ printer }) => {
  return (
    <div className="printer-connection">
      <h2 className="hidden">Connection</h2>
      <ul>
          <li>Status: {printer.client.connected ? 'Active' : 'Inactive'}</li>
          <li>Client: {printer.client.name} (<code>{JSON.stringify(printer.client.version)}</code>)</li>
          <li>Client hostname: <a href={`http://${printer.hostname}`} target="_blank" rel="noopener noreferrer">{printer.hostname}</a></li>
          <li>Client IP: <a href={`http://${printer.ip}`} target="_blank" rel="noopener noreferrer">{printer.ip}</a></li>
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
        <BoxedModal onBack={() => {
          this.setState({
            showDeleteModal: false
          });
        }}>
          <h1>Are you sure?</h1>
          <div>
            <p>You can add the printer back later by simply adding <code>{printer.ip}</code> again.</p>
            <p>
              <button type="submit" onClick={() => {
                deletePrinter(printer.ip);
                onPrinterDelete(printer.ip);
              }}>Remove printer</button>
            </p>
          </div>
        </BoxedModal>
        );
    }
    return (
      <div>
        <h1>
          {printer.name}
        </h1>
        <div>
          <PrinterActions ip={printer.ip} connected={printer.client.connected} currentState={printer.status.state} onPrinterDelete={() => {
            this.setState({
              showDeleteModal: true,
            })
          }} />
          <PrinterState printer={printer} />
          {printer.webcam.stream && <WebcamStream {...printer.webcam} />}
        </div>
        <hr />
      </div>
    );
  }
}

export default PrinterView;