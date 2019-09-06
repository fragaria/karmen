import React from 'react';
import { deletePrinter } from '../services/karmen-backend';

class WebcamStream extends React.Component {
  state = {
    isOnline: false,
  }
  componentDidMount() {
    const { stream } = this.props;
    fetch(stream)
      .then((r) => {
        if (r.status === 200) {
          this.setState({
            isOnline: true,
          });
        }
      }).catch((e) => {
        // silent pass
      });
  }

  componentWillUnmount() {
    this.setState({
      isOnline: false,
    })
  }

  render() {
    const { isOnline } = this.state;
    const { stream, flipHorizontal, flipVertical, rotate90 } = this.props;
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

    return <p>
      {isOnline ?
        <img
          className={klass.join(' ')}
          alt={stream}
          src={`${stream}?t=${(new Date()).getTime()}`}
        /> :
        <strong>Stream not accessible</strong>
      }
    </p>;
  }
}

const Job = ({ name, completion, printTime, printTimeLeft }) => {
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
    <ul>
      <li>Name: {name}</li>
      <li>Completion: {printTime > 0 ? completion.toFixed(2) : '0'}%</li>
      <li>Print time left (approx.): {approxPrintTimeLeft || '?'}</li>
    </ul>
  );
}

const Temperature = ({name, actual, target }) => {
  return <p>{name}: {actual}/{target} &#176;C</p>
}

const PrinterActions = ({ ip, onPrinterDelete }) => {
  return (
    <ul>
      <li><button onClick={(e) => {
        deletePrinter(ip);
        onPrinterDelete(ip);
      }}>Remove</button></li>
      <li>Edit</li>
    </ul>
  );
}

const PrinterView = ({ printer, onPrinterDelete }) => {
  return (
    <div>
      <h1>
        {printer.name}
      </h1>
      <div>
        <h2>Connection</h2>
        <ul>
            <li>Status: {printer.client.connected ? 'Active' : 'Inactive'}</li>
            <li>Client: {printer.client.name} (<code>{JSON.stringify(printer.client.version)}</code>)</li>
            <li>Client hostname: <a href={`http://${printer.hostname}`} target="_blank" rel="noopener noreferrer">{printer.hostname}</a></li>
            <li>Client IP: <a href={`http://${printer.ip}`} target="_blank" rel="noopener noreferrer">{printer.ip}</a></li>
        </ul>
        <h3>Actions</h3>
        <PrinterActions ip={printer.ip} onPrinterDelete={onPrinterDelete} />
        <hr />
      </div>
      <div>
        <h2>Current state</h2>
        <p>State: <strong>{printer.status.state}</strong></p>
        {printer.status.temperature && printer.status.temperature.tool0 && <Temperature name="Tool" {...printer.status.temperature.tool0} />}
        {printer.status.temperature && printer.status.temperature.bed && <Temperature name="Bed" {...printer.status.temperature.bed} />}
        {printer.job.name && <Job {...printer.job} />}
        {printer.webcam.stream && <WebcamStream {...printer.webcam} />}
      </div>
    </div>
  );
}

export default PrinterView;