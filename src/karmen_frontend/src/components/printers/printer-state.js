import React from "react";

export const PrinterState = ({ printer }) => {
  let printerStatusClass = "";
  if (printer.status) {
    if (["Operational", "Online"].indexOf(printer.status.state) > -1) {
      printerStatusClass = "text-warning";
    } else if (
      ["Offline", "Closed"].indexOf(printer.status.state) > -1 ||
      printer.status.state.match(/^Printer is not/)
    ) {
      printerStatusClass = "text-normal";
    }
  }
  return (
    <>
      {printer.client && printer.client.access_level === "protected" ? (
        <strong className={`text-secondary`}>Authorization required</strong>
      ) : (
        <>
          <span>is </span>
          <strong
            className={
              printer.client && printer.client.connected
                ? "text-success"
                : "text-secondary"
            }
          >
            {printer.client && printer.client.connected
              ? "connected"
              : "disconnected"}
          </strong>
          <span> and </span>
          <strong className={printerStatusClass}>
            {printer.status && printer.status.state
              ? printer.status.state
              : "Unknown"}
          </strong>
          {printer.client && printer.client.access_level === "read_only" && (
            <span className={`tag`}>{"Read only"}</span>
          )}
        </>
      )}
    </>
  );
};

export default PrinterState;
