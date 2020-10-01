import React from "react";

export const PrinterState = ({ printer }) => {
  // let printerStatusClass = "";
  // if (!printer.client.octoprint.version) {
  //   if (["Operational", "Online"].indexOf(printer.status.state) > -1) {
  //     printerStatusClass = "text-warning";
  //   } else if (
  //     ["Offline", "Closed"].indexOf(printer.status.state) > -1 ||
  //     printer.status.state.match(/^Printer is not/)
  //   ) {
  //     printerStatusClass = "text-normal";
  //   }
  // }
  if (!printer || !printer.client || !printer.client.octoprint) {
    return <>Status unknown</>
  }
  if (printer.client.octoprint.error) {
    return <>{printer.client.octoprint.error.detail}</>
  }
  if (!printer.client.octoprint.printer.state) {
    return <>Printer disconnected</>
  }
  let statuses = []
  if (printer.client.octoprint.printer.state) {
    let printerStates = printer.client.octoprint.printer.state;
    statuses = Object.keys(printerStates).filter((s) => printerStates[s])
  }
  return (
    // printer.client.octoprint.printer.state. 
    <>Printer is {statuses.join(', ')}</>
  );
  // return (
  //   <>
  //     {printer.client && printer.client.access_level === "protected" ? (
  //       <strong className={`text-secondary`}>Authorization required</strong>
  //     ) : (
  //       <>
  //         <span>is </span>
  //         <strong
  //           className={
  //             printer.client && printer.client.connected
  //               ? "text-success"
  //               : "text-secondary"
  //           }
  //         >
  //           {printer.client && printer.client.connected
  //             ? "connected"
  //             : "disconnected"}
  //         </strong>
  //         <span> and </span>
  //         <strong className={printerStatusClass}>
  //           {printer.status && printer.status.state
  //             ? printer.status.state
  //             : "Unknown"}
  //         </strong>
  //         {printer.client && printer.client.access_level === "read_only" && (
  //           <span className={`tag`}>{"Read only"}</span>
  //         )}
  //       </>
  //     )}
  //   </>
  // );
};

export default PrinterState;
