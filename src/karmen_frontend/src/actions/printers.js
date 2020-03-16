import { createActionThunk } from "redux-thunk-actions";
import * as backend from "../services/backend";
import { retryIfUnauthorized } from "./users-me";

const PRINTER_IDLE_POLL = Math.floor(Math.random() * (7000 + 1) + 11000);
const PRINTER_RUNNING_POLL = Math.floor(Math.random() * (4000 + 1) + 5000);

export const loadAndQueuePrinter = (orguuid, uuid, fields) => (
  dispatch,
  getState
) => {
  return dispatch(loadPrinter(orguuid, uuid, fields)).then(result => {
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
        dispatch(setPrinterPollInterval(orguuid, uuid, poll));
        dispatch(
          queueLoadPrinter(
            orguuid,
            uuid,
            ["job", "status", "webcam", "lights"],
            poll
          )
        );
      }
      return result;
    }
  });
};

export const loadAndQueuePrinters = (orguuid, fields) => (
  dispatch,
  getState
) => {
  return dispatch(loadPrinters(orguuid, fields)).then(result => {
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
            dispatch(setPrinterPollInterval(orguuid, printer.uuid, poll));
            dispatch(
              queueLoadPrinter(
                orguuid,
                printer.uuid,
                ["job", "status", "webcam", "lights"],
                poll
              )
            );
          }
        }
      }
      return result;
    }
  });
};

export const setPrinterPollInterval = (orguuid, uuid, interval) => {
  return {
    type: "PRINTERS_POLL_INTERVAL_SET",
    payload: {
      uuid,
      interval
    }
  };
};

export const queueLoadPrinter = (orguuid, uuid, fields, delay) => (
  dispatch,
  getState
) => {
  setTimeout(() => {
    const { printers } = getState();
    const previousInfo =
      printers.printers && printers.printers.find(p => p.uuid === uuid);
    dispatch(loadPrinter(orguuid, uuid, fields)).then(result => {
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
          dispatch(setPrinterPollInterval(orguuid, uuid, interval));
        }
        // enqueue next check if result is ok
        if (result.status === 200) {
          dispatch(
            queueLoadPrinter(
              orguuid,
              uuid,
              ["job", "status", "webcam", "lights"],
              interval
            )
          );
        } else {
          dispatch(setPrinterPollInterval(orguuid, uuid, -1));
        }
      }
      return result;
    });
  }, delay);
};

export const loadPrinters = createActionThunk(
  "PRINTERS_LOAD",
  (orguuid, fields = [], { dispatch, getState }) => {
    const { me } = getState();
    if (!me.organizations || !me.organizations[orguuid]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.getPrinters, dispatch)(
      orguuid,
      fields
    ).then(data => {
      return Object.assign(data, {
        organizationUuid: orguuid
      });
    });
  }
);

export const loadPrinter = createActionThunk(
  "PRINTERS_LOAD_DETAIL",
  (orguuid, uuid, fields = [], { dispatch, getState }) => {
    const { me } = getState();
    if (!me.organizations || !me.organizations[orguuid]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.getPrinter, dispatch)(
      orguuid,
      uuid,
      fields
    ).then(data => {
      return Object.assign(data, {
        organizationUuid: orguuid
      });
    });
  }
);

export const addPrinter = createActionThunk(
  "PRINTERS_ADD",
  (
    orguuid,
    protocol,
    hostname,
    ip,
    port,
    path,
    token,
    name,
    apiKey,
    { dispatch, getState }
  ) => {
    const { me } = getState();
    if (!me.organizations || !me.organizations[orguuid]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.addPrinter, dispatch)(
      orguuid,
      protocol,
      hostname,
      ip,
      port,
      path,
      token,
      name,
      apiKey
    ).then(data => {
      return Object.assign(data, {
        organizationUuid: orguuid
      });
    });
  }
);

export const patchPrinter = createActionThunk(
  "PRINTERS_PATCH",
  (orguuid, uuid, data, { dispatch, getState }) => {
    const { me } = getState();
    if (!me.organizations || !me.organizations[orguuid]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.patchPrinter, dispatch)(
      orguuid,
      uuid,
      data
    ).then(data => {
      return Object.assign(data, {
        organizationUuid: orguuid
      });
    });
  }
);

export const deletePrinter = createActionThunk(
  "PRINTERS_DELETE",
  (orguuid, uuid, { dispatch, getState }) => {
    const { me } = getState();
    if (!me.organizations || !me.organizations[orguuid]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.deletePrinter, dispatch)(
      orguuid,
      uuid
    ).then(r => {
      if (r.status !== 204) {
        r.data.uuid = null;
      }
      return r;
    });
  }
);

export const setPrinterConnection = createActionThunk(
  "PRINTERS_SET_CONNECTION",
  (orguuid, uuid, state, { dispatch, getState }) => {
    const { me } = getState();
    if (!me.organizations || !me.organizations[orguuid]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.setPrinterConnection, dispatch)(
      orguuid,
      uuid,
      state
    );
  }
);

export const changeCurrentJob = createActionThunk(
  "PRINTERS_CHANGE_JOB",
  (orguuid, uuid, action, { dispatch, getState }) => {
    const { me } = getState();
    if (!me.organizations || !me.organizations[orguuid]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.changeCurrentJob, dispatch)(
      orguuid,
      uuid,
      action
    );
  }
);

export const changeLights = createActionThunk(
  "PRINTERS_CHANGE_LIGHTS",
  (orguuid, uuid, { dispatch, getState }) => {
    const { me } = getState();
    if (!me.organizations || !me.organizations[orguuid]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.changeLights, dispatch)(orguuid, uuid);
  }
);
