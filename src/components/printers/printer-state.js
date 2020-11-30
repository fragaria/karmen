import React from "react";
import ReactTooltip from "react-tooltip";

function buildLabels(labels) {
  return (
    <>
      <ReactTooltip />
      <span className="list-item-subtitle">
        {labels.map(function (label, index) {
          return (
            <span
              key={index}
              className={"printer-status-label " + label.color}
              title={label.detail}
            >
              {" "}
              {label.status}
            </span>
          );
        })}
      </span>
    </>
  );
}

export const PrinterState = ({ printer }) => {
  if (!printer.client || !printer.client.octoprint) {
    return buildLabels([{ color: "gray", status: "Offline" }]);
  }

  let labels = [];

  if (printer.client.octoprint && printer.client.octoprint.error) {
    let err = printer.client.octoprint.error;
    if (err.code === "unknown-response") {
      // if WS API returns 502 or 504, backend considers it as unknown response, but it means pill is offline
      return buildLabels([
        {
          color: "gray",
          status: "Offline",
          detail: "It looks like your device is not connected to the internet.",
        },
      ]);
    }
    if (err.code === "moved-to-background") {
      // if WS API returns 502 or 504, backend considers it as unknown response, but it means pill is offline
      return buildLabels([
        {
          color: "orange",
          status: "Connecting",
          detail: "We are trying to connect to your device.",
        },
      ]);
    }

    // Offline errors should be handled, now the rest should come from online devices.

    if (err.code === "permission-denied") {
      return buildLabels(
        labels.concat({
          color: "red",
          status: "Authorization error",
          detail:
            "Looks like this printer is protected and you did not entered the correct API key",
        })
      );
    }
    labels.push({
      color: "red",
      status: "Error",
      detail: err.code + ": " + err.detail,
    });
  }

  if (printer.client.pill.error) {
    let code = printer.client.pill.error.code;
    if (code === "unknown-response") {
      //pill is offline
      // again, API returns 502, which means pill is offline
      // but this could be older, cached response, since pill api is set to longer caching
    } else if (code === "moved-to-background") {
      // this means getting pill info took to long, no big deal, it's not essential and we could wait for it
    } else if (
      code === "not-supported" &&
      printer.client.pill.error.detail.includes("(404)")
    ) {
      //404 on pill, virtual device
    } else {
      // this means we have some unexpected error with pill
      labels.push({
        color: "red",
        status: "Pill error",
        detail:
          printer.client.pill.error.code +
          ": " +
          printer.client.pill.error.detail,
      });
    }
  }

  if (
    !printer.client.octoprint ||
    !printer.client.octoprint.printer ||
    printer.client.octoprint.printer.error
  ) {
    if (printer.client.octoprint.printer.error) {
      let err = printer.client.octoprint.printer.error;
      if (err.code === "printer-not-operational") {
        return buildLabels(
          labels.concat({
            color: "orange",
            status: "Printer disconnected",
            detail:
              "Printer is not connected to Pill. Make sure it's powered on and click connect.",
          })
        );
      } else {
        return buildLabels(
          labels.concat({
            color: "red",
            status: "Printer error",
            detail: err.code + ": " + err.detail,
          })
        );
      }
    }
    return buildLabels(labels.concat({ color: "red", status: "Error" }));
  }

  if (printer.client.octoprint.printer.state.flags) {
    //https://docs.octoprint.org/en/master/api/datamodel.html#printer-state
    let printerStates = printer.client.octoprint.printer.state.flags;

    if (printerStates.error) {
      labels.push({
        color: "red",
        status: "Error",
        detail: printer.client.octoprint.printer.state.text,
      });
    }
    if (printerStates.cancelling) {
      labels.push({ color: "red", status: "Cancelling" });
    }
    if (printerStates.finishing) {
      labels.push({ color: "orange", status: "Finishing" });
    }
    if (printerStates.pausing) {
      labels.push({ color: "red", status: "Pausing" });
    }
    if (printerStates.paused) {
      labels.push({ color: "red", status: "Paused" });
    }
    if (printerStates.resuming) {
      labels.push({ color: "red", status: "Resuming" });
    }
    if (printerStates.printing) {
      labels.push({ color: "orange", status: "Printing" });
    }
    if (printerStates.closedOrError) {
      labels.push({ color: "orange", status: "Disconnected" });
    }

    if (printerStates.operational && printerStates.ready) {
      labels.push({ color: "green", status: "Ready to print" });
    }
    if (
      printerStates.operational &&
      !printerStates.ready &&
      !printerStates.printing &&
      !printerStates.error
    ) {
      // this may be e.g. sd card copy in progress
      labels.push({
        color: "orange",
        status: "Working",
        detail: "Printer is busy right now and should become ready soon.",
      });
    }
  }
  return buildLabels(labels);

  /*
  cancelling: false
  closedOrError: false
  error: false
  finishing: false
  operational: true
  paused: false
  pausing: false
  printing: true
  ready: false
  resuming: false
  sdReady: false

   */
};

export default PrinterState;
