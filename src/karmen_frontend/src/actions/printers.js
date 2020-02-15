import { createActionThunk } from "redux-thunk-actions";
import * as backend from "../services/backend";
import { retryIfUnauthorized } from "./users";

const PRINTER_IDLE_POLL = Math.floor(Math.random() * (7000 + 1) + 11000);
const PRINTER_RUNNING_POLL = Math.floor(Math.random() * (4000 + 1) + 5000);

export const loadAndQueuePrinter = (uuid, fields) => (dispatch, getState) => {
  return dispatch(loadPrinter(uuid, fields)).then(result => {
    const { printers } = getState();
    if (result && result.data && printers.checkQueue) {
      const existing = printers.checkQueue[uuid];
      if (existing === null || existing === undefined) {
        const poll =
          ["Printing", "Paused"].indexOf(
            result.data.status && result.data.status.state
          ) > -1
            ? PRINTER_RUNNING_POLL
            : PRINTER_IDLE_POLL;
        dispatch(setPrinterPollInterval(uuid, poll));
        dispatch(queueLoadPrinter(uuid, ["job", "status", "webcam"], poll));
      }
      return result;
    }
  });
};

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
            dispatch(
              queueLoadPrinter(printer.uuid, ["job", "status", "webcam"], poll)
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

export const queueLoadPrinter = (uuid, fields, delay) => (
  dispatch,
  getState
) => {
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
          dispatch(
            queueLoadPrinter(uuid, ["job", "status", "webcam"], interval)
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

export const setWebcamRefreshInterval = (uuid, interval) => (
  dispatch,
  getState
) => {
  const { printers } = getState();
  if (printers.webcamQueue && printers.webcamQueue[uuid] === undefined) {
    // we need to delay this so interval_set is run before
    const timeout = setTimeout(() => dispatch(getWebcamSnapshot(uuid)), 300);
    return dispatch({
      type: "PRINTERS_WEBCAM_TIMEOUT_SET",
      payload: {
        uuid,
        interval: interval > 0 ? interval : 60 * 1000,
        timeout
      }
    });
  }
  if (printers.webcamQueue[uuid].interval > interval) {
    clearTimeout(printers.webcamQueue[uuid].timeout);
    // we need to delay this so interval_set is run before
    const timeout = setTimeout(() => dispatch(getWebcamSnapshot(uuid)), 300);
    return dispatch({
      type: "PRINTERS_WEBCAM_TIMEOUT_SET",
      payload: {
        uuid,
        interval: interval > 0 ? interval : 60 * 1000,
        timeout
      }
    });
  }
  if (printers.webcamQueue[uuid].interval !== interval) {
    return dispatch({
      type: "PRINTERS_WEBCAM_INTERVAL_SET",
      payload: {
        uuid,
        interval: interval > 0 ? interval : 60 * 1000
      }
    });
  }
};

export const getWebcamSnapshot = createActionThunk(
  "PRINTERS_GET_WEBCAM_SNAPSHOT",
  (uuid, { dispatch, getState }) => {
    let { printers } = getState();
    const printer = printers.printers.find(p => p.uuid === uuid);
    if (!printer || !printer.webcam || !printer.webcam.url) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(
      backend.getWebcamSnapshot,
      dispatch
    )(printer.webcam.url).then(r => {
      if (r.status === 202 || r.status === 200) {
        let { printers } = getState();
        if (printers.webcamQueue && printers.webcamQueue[uuid]) {
          const timeoutData = printers.webcamQueue[uuid];
          if (timeoutData.interval > 0) {
            const timeout = setTimeout(
              () => dispatch(getWebcamSnapshot(uuid)),
              timeoutData.interval
            );
            dispatch({
              type: "PRINTERS_WEBCAM_TIMEOUT_SET",
              payload: {
                uuid,
                interval: timeoutData.interval,
                timeout
              }
            });
          }
        }
      }
      if (r.data && r.data.prefix && r.data.data) {
        return {
          uuid,
          status: r.status,
          ...r.data
        };
      }
      return {
        uuid,
        status: r.status
      };
    });
  }
);
