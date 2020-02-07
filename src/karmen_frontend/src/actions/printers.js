import { createActionThunk } from "redux-thunk-actions";
import * as backend from "../services/backend";
import { retryIfUnauthorized } from "./users";

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
  (fields = [], { dispatch }) => {
    return retryIfUnauthorized(backend.getPrinters, dispatch)(fields);
  }
);

export const loadPrinter = createActionThunk(
  "PRINTERS_LOAD_DETAIL",
  (uuid, fields = [], { dispatch }) => {
    return retryIfUnauthorized(backend.getPrinter, dispatch)(uuid, fields);
  }
);

export const addPrinter = createActionThunk(
  "PRINTERS_ADD",
  (protocol, hostname, ip, port, name, apiKey, { dispatch }) => {
    return retryIfUnauthorized(backend.addPrinter, dispatch)(
      protocol,
      hostname,
      ip,
      port,
      name,
      apiKey
    );
  }
);

export const patchPrinter = createActionThunk(
  "PRINTERS_PATCH",
  (uuid, data, { dispatch }) => {
    return retryIfUnauthorized(backend.patchPrinter, dispatch)(uuid, data);
  }
);

export const deletePrinter = createActionThunk(
  "PRINTERS_DELETE",
  (uuid, { dispatch }) => {
    return retryIfUnauthorized(
      backend.deletePrinter,
      dispatch
    )(uuid).then(r => {
      if (r.status !== 204) {
        r.data.uuid = null;
      }
      return r;
    });
  }
);

export const setPrinterConnection = createActionThunk(
  "PRINTERS_SET_CONNECTION",
  (uuid, state, { dispatch }) => {
    return retryIfUnauthorized(backend.setPrinterConnection, dispatch)(
      uuid,
      state
    );
  }
);

export const changeCurrentJob = createActionThunk(
  "PRINTERS_CHANGE_JOB",
  (uuid, action, { dispatch }) => {
    return retryIfUnauthorized(backend.changeCurrentJob, dispatch)(
      uuid,
      action
    );
  }
);

export const getWebcamSnapshot = createActionThunk(
  "PRINTERS_GET_WEBCAM_SNAPSHOT",
  (url, { dispatch }) => {
    return retryIfUnauthorized(backend.getWebcamSnapshot, dispatch)(url);
  }
);
