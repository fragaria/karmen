import React from 'react';
import { Link } from 'react-router-dom';
import BoxedModal from './boxed-modal';
import { WebcamStream } from './webcam-stream';
import formatters from '../services/formatters';

export const Progress = ({ completion, printTime, printTimeLeft, withProgressBar = true }) => {
  let progressBarWidth = {
    width: (printTime > 0 ? completion.toFixed(2) : '0')+'%',
  };
  let approxPrintTimeLeft = printTimeLeft;
  if (!approxPrintTimeLeft && printTime > 0) {
    approxPrintTimeLeft = (printTime / completion) * (100 - completion);
  }
  if (approxPrintTimeLeft) {
    approxPrintTimeLeft = formatters.timespan(approxPrintTimeLeft);
  }
  return (
    <div className="progress">
      <div className="progress-detail">
        {approxPrintTimeLeft
          ? <React.Fragment>{printTime > 0 ? completion.toFixed(2) : '0'}% ({approxPrintTimeLeft || '?'} remaining)</React.Fragment>
          : <React.Fragment></React.Fragment>
        }
      </div>
      {withProgressBar && <div className="progress-bar" style={progressBarWidth}></div>}
    </div>
  );
}


export const Temperature = ({name, actual, target }) => {
  return <span> {name}: {actual}/{target} &#176;C</span>
}

export const PrinterActions = ({ host, onPrinterDelete }) => {
    return (
      <div className="box-actions">
        <h2 className="hidden">Actions</h2>
        <Link to={`/printers/${host}`}><i className="icon icon-cog"></i></Link>
        <button className="plain" onClick={onPrinterDelete}><i className="icon icon-bin"></i></button>
      </div>
    );
}

export const PrinterTags = ({ printer }) => {
  let printerStatusClass = '';
  if (["Operational", "Online"].indexOf(printer.status.state) > -1) {
    printerStatusClass = "state-active";
  } else if (["Offline", "Closed"].indexOf(printer.status.state) > -1 || printer.status.state.match(/^Printer is not/)) {
    printerStatusClass = "state-inactive";
  }
  return (
    <div className="tags">
      {printer.client.access_level === 'protected'
       ? <span className={`tag state-inactive`}>Authorization required</span>
       : 
       <>
         <span className={`tag ${printer.client.connected ? "state-active" : "state-inactive"}`}>
          {printer.client.connected ? `${printer.client.name} connected` : `${printer.client.name} disconnected`}
        </span>
        <span className={`tag ${printerStatusClass}`}>{printer.status.state}</span>
        {printer.client.access_level === 'read_only' && <span className={`tag`}>{"Read only"}</span>}
       </>
     }
    </div>
  );
};

export const PrinterTemperatures = ({ temperature }) => {
  return (
    <>
      {temperature.tool0 && <><Temperature name="Tool" {...temperature.tool0} />,</>}
      {temperature.bed && <Temperature name="Bed" {...temperature.bed} />}
    </>
  );
}

export const PrinterState = ({ printer }) => {
  const props = printer.printer_props;
  return (
    <div className="printer-state">
      <h2 className="hidden">Current state</h2>
      <PrinterTags printer={printer} />
      {printer.status.temperature ? <PrinterTemperatures temperature={printer.status.temperature} /> : <>&nbsp;</>}
      {printer.job && printer.job.name && <p>Printing: <strong>{(printer.job && printer.job.name) || '\u00A0'}</strong></p>}
      {props && (props.filament_type || props.filament_color || props.bed_type || props.tool0_diameter) && <p>
        Setup: {props.filament_type} {props.filament_color && <>({props.filament_color})</>}
        {(props.bed_type || props.tool0_diameter) && `, `}
        {props.bed_type}
        {props.tool0_diameter && (<>, nozzle {props.tool0_diameter} mm</>)}
      </p>}
    </div>
  );
}

export class PrinterView extends React.Component {
  state = {
    showDeleteModal: false,
    showCancelModal: false,
  }
  render() {
    const { showDeleteModal, showCancelModal } = this.state;
    const { printer, onPrinterDelete, changeCurrentJobState, canChangeCurrentJob } = this.props;
    let { showActions } = this.props;
    if (showActions === undefined || showActions === null) {
      showActions = true;
    }
    if (showDeleteModal) {
      return (
        <BoxedModal inverse onBack={() => {
          this.setState({
            showDeleteModal: false,
            showCancelModal: false,
          });
        }}>
          <h1>Are you sure?</h1>
            <p>You can add the printer back later by simply adding <code>{printer.host}</code> again.</p>
            <button type="submit" onClick={() => {
              onPrinterDelete(printer.host);
            }}>Remove printer</button>
        </BoxedModal>
        );
    }
    if (showCancelModal) {
      return (
        <BoxedModal inverse backText="Keep printing" onBack={() => {
          this.setState({
            showDeleteModal: false,
            showCancelModal: false,
          });
        }}>
          <h1>Are you sure?</h1>
            <p>You are about to cancel the whole print!</p>
            <button type="submit" onClick={() => {
              changeCurrentJobState(printer.host, 'cancel')
                .then(() => {
                  this.setState({
                    showDeleteModal: false,
                    showCancelModal: false,
                  });
                })
            }}>Cancel the print</button>
        </BoxedModal>
        );
    }
    return (
      <>
        <div className="stream-wrapper">
          <WebcamStream {...printer.webcam} />
          <Progress {...printer.job} />
          {printer.status &&
            ['Printing', 'Paused'].indexOf(printer.status.state) > -1 &&
            printer.client.access_level === 'unlocked' &&
            canChangeCurrentJob && (
            <div className="printer-controls">
              {printer.status.state === 'Paused'
                ? (
                <button className="plain" onClick={() => {
                  changeCurrentJobState(printer.host, 'resume');
                }}>
                  <span className="icon-play"></span>
                </button>)
                : (
                <button className="plain" onClick={() => {
                  changeCurrentJobState(printer.host, 'pause');
                }}>
                  <span className="icon-pause"></span>
                </button>)
              }
                <button className="plain" onClick={() => {
                  this.setState({
                    showCancelModal: true,
                  });
                }}>
                <span className="icon-stop"></span>
              </button>
            </div>
          )}
        </div>
        <div className="box-details">
          <div className="title">
            <a href={`${printer.protocol}://${printer.host}`} target="_blank" rel="noopener noreferrer">
              <strong>{printer.name}</strong>
            </a>
          </div>
          <PrinterState printer={printer} />
          {showActions && <PrinterActions host={printer.host} onPrinterDelete={() => {
            this.setState({
              showDeleteModal: true,
            })
          }} />}
        </div>
      </>
    );
  }
}

export default PrinterView;