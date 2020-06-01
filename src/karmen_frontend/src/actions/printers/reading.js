import { createHttpAction } from "../utils";
import * as backend from "../../services/backend";
import { retryIfUnauthorized, denyWithNoOrganizationAccess } from "../users-me";
import { HttpError } from "../../errors";

const PRINTER_IDLE_POLL = Math.floor(Math.random() * (7000 + 1) + 11000);
const PRINTER_RUNNING_POLL = Math.floor(Math.random() * (4000 + 1) + 5000);

export const loadAndQueuePrinter = (orguuid, uuid, fields) => (
  dispatch,
  getState
) => {
  return dispatch(loadPrinter(orguuid, uuid, fields)).then((result) => {
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
  return dispatch(loadPrinters(orguuid, fields)).then((result) => {
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
      interval,
    },
  };
};

export const queueLoadPrinter = (orguuid, uuid, fields, delay) => (
  dispatch,
  getState
) => {
  setTimeout(() => {
    const { printers } = getState();
    const previousInfo =
      printers.printers && printers.printers.find((p) => p.uuid === uuid);
    dispatch(loadPrinter(orguuid, uuid, fields)).then((result) => {
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

export const loadPrinters = createHttpAction(
  "PRINTERS_LOAD",
  (orguuid, fields = [], { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.getPrinters, dispatch)(
        orguuid,
        fields
      );
    });
  }
);

export const loadPrintersOld = createHttpAction(
  "PRINTERS_LOAD",
  (orguuid, fields = [], { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.getPrinters, dispatch)(
        orguuid,
        fields
      );
    });
  }
);

export const loadPrinter = createHttpAction(
  "PRINTERS_LOAD_DETAIL",
  (orguuid, uuid, fields = [], { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.getPrinter, dispatch)(
        orguuid,
        uuid,
        fields
      );
    });
  }
);

export const setWebcamRefreshInterval = (orguuid, uuid, interval) => (
  dispatch,
  getState
) => {
  const { webcams } = getState();
  if (webcams.queue && webcams.queue[uuid] === undefined) {
    // we need to delay this so interval_set is run before
    const timeout = setTimeout(
      () => dispatch(getWebcamSnapshot(orguuid, uuid)),
      300
    );
    return dispatch({
      type: "WEBCAMS_TIMEOUT_SET",
      payload: {
        uuid,
        interval: interval > 0 ? interval : 60 * 1000,
        timeout,
      },
    });
  }
  if (webcams.queue[uuid].interval > interval) {
    clearTimeout(webcams.queue[uuid].timeout);
    // we need to delay this so interval_set is run before
    const timeout = setTimeout(
      () => dispatch(getWebcamSnapshot(orguuid, uuid)),
      300
    );
    return dispatch({
      type: "WEBCAMS_TIMEOUT_SET",
      payload: {
        uuid,
        interval: interval > 0 ? interval : 60 * 1000,
        timeout,
      },
    });
  }
  if (webcams.queue[uuid].interval !== interval) {
    return dispatch({
      type: "WEBCAMS_INTERVAL_SET",
      payload: {
        uuid,
        interval: interval > 0 ? interval : 60 * 1000,
      },
    });
  }
};

export const getWebcamSnapshot = createHttpAction(
  "WEBCAMS_GET_SNAPSHOT",
  (orguuid, uuid, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      let { printers } = getState();
      const printer = printers.printers.find((p) => p.uuid === uuid);

      if (!printer || !printer.webcam || !printer.webcam.url) {
        return Promise.reject();
      }

      return retryIfUnauthorized(
        backend.getWebcamSnapshot,
        dispatch
      )(printer.webcam.url).then((r) => {
        let { webcams } = getState();

        if (webcams.queue && webcams.queue[uuid]) {
          const timeoutData = webcams.queue[uuid];

          if (timeoutData.interval > 0) {
            const timeout = setTimeout(
              () => dispatch(getWebcamSnapshot(orguuid, uuid)),
              timeoutData.interval
            );

            dispatch({
              type: "WEBCAMS_TIMEOUT_SET",
              payload: {
                uuid,
                interval: timeoutData.interval,
                timeout,
              },
            });
          }
        }

        return {
          organizationUuid: orguuid,
          uuid,
          status: r.status,
          ...r.data,
          successCodes: [200],
        };
      });
    }).catch((err) => {
      if (!(err instanceof HttpError)) {
        throw err;
      }
      // HttpError is most cases an 404 if the snapshot URL cant' be reached.
      // This is not critical and will already be logged in the console.
      // Usually, this is a result of bad configuration of some sorts. So it's
      // kinda safe to just do nothing. In other cases, let's admin something
      // went wrong.
      if (err.response.status !== 404) {
        throw err;
      }
    });
  }
);
