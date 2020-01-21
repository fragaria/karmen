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
          const existing = printers.checkQueue[printer.uuid];
          if (existing === null || existing === undefined) {
            const poll =
              ["Printing", "Paused"].indexOf(printer.status.state) > -1
                ? PRINTER_RUNNING_POLL
                : PRINTER_IDLE_POLL;
            dispatch(setPrinterPollInterval(printer.uuid, poll));
            queueLoadPrinter(
              dispatch,
              getState,
              printer.uuid,
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

export const setPrinterPollInterval = (uuid, interval) => {
  return {
    type: "PRINTERS_POLL_INTERVAL_SET",
    payload: {
      uuid,
      interval
    }
  };
};

export const queueLoadPrinter = (dispatch, getState, uuid, fields, delay) => {
  setTimeout(() => {
    const { printers } = getState();
    const previousInfo =
      printers.printers && printers.printers.find(p => p.uuid === uuid);
    dispatch(loadPrinter(uuid, fields)).then(result => {
      const { printers } = getState();
      if (printers.checkQueue[uuid] > 0) {
        let interval = printers.checkQueue[uuid];
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
          dispatch(setPrinterPollInterval(uuid, interval));
        }
        // enqueue next check if result is ok
        if (result.status === 200) {
          queueLoadPrinter(
            dispatch,
            getState,
            uuid,
            ["job", "status", "webcam"],
            interval
          );
        } else {
          dispatch(setPrinterPollInterval(uuid, -1));
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
  (uuid, fields = []) => {
    return backend.getPrinter(uuid, fields);
  }
);

export const addPrinter = createActionThunk(
  "PRINTERS_ADD",
  (protocol, hostname, ip, port, name, apiKey) => {
    return backend.addPrinter(protocol, hostname, ip, port, name, apiKey);
  }
);

export const patchPrinter = createActionThunk(
  "PRINTERS_PATCH",
  (uuid, data) => {
    return backend.patchPrinter(uuid, data);
  }
);

export const deletePrinter = createActionThunk("PRINTERS_DELETE", uuid => {
  return backend.deletePrinter(uuid).then(r => {
    if (r.status !== 204) {
      r.data.uuid = null;
    }
    return r;
  });
});

export const setPrinterConnection = createActionThunk(
  "PRINTERS_SET_CONNECTION",
  (uuid, state) => {
    return backend.setPrinterConnection(uuid, state);
  }
);

export const changeCurrentJob = createActionThunk(
  "PRINTERS_CHANGE_JOB",
  (uuid, action) => {
    return backend.changeCurrentJob(uuid, action);
  }
);
