import React from 'react';

export const PrinterState = ({ printer }) => {
  let printerStatusClass = '';
  if (["Operational", "Online"].indexOf(printer.status.state) > -1) {
    printerStatusClass = "text-warning";
  } else if (["Offline", "Closed"].indexOf(printer.status.state) > -1 || printer.status.state.match(/^Printer is not/)) {
    printerStatusClass = "text-normal";
  }
  return (
    <>
      {printer.client.access_level === 'protected'
       ? <span className={`text-secondary`}>Authorization required</span>
       :
       <>
        <span>is</span>
        &nbsp;
        <strong className={printer.client.connected ? "text-success" : "text-secondary"}>
          {printer.client.connected ? `${printer.client.name} connected` : `${printer.client.name} disconnected`}
        </strong>
        &nbsp;
        <span>and</span>
        &nbsp;
        <strong className={printerStatusClass}>{printer.status.state}</strong>
        {printer.client.access_level === 'read_only' && <span className={`tag`}>{"Read only"}</span>}
       </>
     }
    </>
  );
};

export default PrinterState;