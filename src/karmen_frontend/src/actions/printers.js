import { createActionThunk } from "redux-thunk-actions";
import * as backend from "../services/backend";

const PRINTER_IDLE_POLL = Math.floor(Math.random() * (7000 + 1) + 11000);
const PRINTER_RUNNING_POLL = Math.floor(Math.random() * (4000 + 1) + 5000);

export const loadAndQueuePrinters = fields => (dispatch, getState) => {
  return dispatch(loadPrinters(fields)).then(result => {
    const { printers } = getState();
    // eslint-disable-next-line no-unused-vars
    if (result && result.data && result.data.items) {
      for (let printer of result.data.items) {
        if (printers.checkQueue) {
          const existing = printers.checkQueue[printer.host];
          if (existing === null || existing === undefined) {
            const poll =
              ["Printing", "Paused"].indexOf(printer.status.state) > -1
                ? PRINTER_RUNNING_POLL
                : PRINTER_IDLE_POLL;
            dispatch(setPrinterPollInterval(printer.host, poll));
            queueLoadPrinter(
              dispatch,
              getState,
              printer.host,
              ["job", "status", "webcam"],
              poll
            );
          }
        }
      }
      return result;
    }
  });
};

export const setPrinterPollInterval = (host, interval) => {
  return {
    type: "PRINTERS_POLL_INTERVAL_SET",
    payload: {
      host,
      interval
    }
  };
};

export const queueLoadPrinter = (dispatch, getState, host, fields, delay) => {
  setTimeout(() => {
    const { printers } = getState();
    const previousInfo =
      printers.printers && printers.printers.find(p => p.host === host);
    dispatch(loadPrinter(host, fields)).then(result => {
      const { printers } = getState();
      if (printers.checkQueue[host] > 0) {
        let interval = printers.checkQueue[host];
        // detect if state change and we need to adjust interval
        if (
          previousInfo &&
          previousInfo.status &&
          result &&
          result.data &&
          result.data.status &&
          result.data.status.state !== previousInfo.status.state
        ) {
          interval =
            ["Printing", "Paused"].indexOf(result.data.status.state) > -1
              ? PRINTER_RUNNING_POLL
              : PRINTER_IDLE_POLL;
          dispatch(setPrinterPollInterval(host, interval));
        }
        // enqueue next check if result is ok
        if (result.status === 200) {
          queueLoadPrinter(
            dispatch,
            getState,
            host,
            ["job", "status", "webcam"],
            interval
          );
        } else {
          dispatch(setPrinterPollInterval(host, -1));
        }
      }
      return result;
    });
  }, delay);
};

export const loadPrinters = createActionThunk(
  "PRINTERS_LOAD",
  (fields = []) => {
    return backend.getPrinters(fields);
  }
);

export const loadPrinter = createActionThunk(
  "PRINTERS_LOAD_DETAIL",
  (host, fields = []) => {
    return backend.getPrinter(host, fields);
  }
);

export const addPrinter = createActionThunk(
  "PRINTERS_ADD",
  (protocol, host, name, apiKey) => {
    return backend.addPrinter(protocol, host, name, apiKey);
  }
);

export const patchPrinter = createActionThunk(
  "PRINTERS_PATCH",
  (host, data) => {
    return backend.patchPrinter(host, data);
  }
);

export const deletePrinter = createActionThunk("PRINTERS_DELETE", host => {
  return backend.deletePrinter(host).then(r => {
    if (r.status !== 204) {
      r.data.host = null;
    }
    return r;
  });
});

export const setPrinterConnection = createActionThunk(
  "PRINTERS_SET_CONNECTION",
  (host, state) => {
    return backend.setPrinterConnection(host, state);
  }
);

export const changeCurrentJob = createActionThunk(
  "PRINTERS_CHANGE_JOB",
  (host, action) => {
    return backend.changeCurrentJob(host, action);
  }
);
