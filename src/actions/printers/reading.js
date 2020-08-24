import { createHttpAction } from "../utils";
import * as backend from "../../services/backend";
import { retryIfUnauthorized, denyWithNoOrganizationAccess } from "../users-me";
import {
  HttpError,
  OrganizationMismatchError,
  StreamUnavailableError,
  FailedToFetchDataError,
} from "../../errors";

const PRINTER_IDLE_POLL = Math.floor(Math.random() * (7000 + 1) + 11000);
const PRINTER_RUNNING_POLL = Math.floor(Math.random() * (4000 + 1) + 5000);

export const loadAndQueuePrinter = (orgid, id, fields) => (
  dispatch,
  getState
) => {
  return dispatch(loadPrinter(orgid, id, fields)).then((result) => {
    const { printers } = getState();
    if (result && result.data && printers.checkQueue) {
      const existing = printers.checkQueue[id];
      if (existing === null || existing === undefined) {
        const poll =
          ["Printing", "Paused"].indexOf(
            result.data.status && result.data.status.state
          ) > -1
            ? PRINTER_RUNNING_POLL
            : PRINTER_IDLE_POLL;
        dispatch(setPrinterPollInterval(orgid, id, poll));
        dispatch(
          queueLoadPrinter(
            orgid,
            id,
            ["job", "status", "webcam", "lights"],
            poll
          )
        );
      }
      return result;
    }
  });
};

export const loadAndQueuePrinters = (orgid, fields) => (
  dispatch,
  getState
) => {
  return dispatch(loadPrinters(orgid, fields)).then((result) => {
    const { printers } = getState();
    // eslint-disable-next-line no-unused-vars
    if (result && result.data && result.data.items) {
      for (let printer of result.data.items) {
        if (printers.checkQueue) {
          const existing = printers.checkQueue[printer.id];
          if (existing === null || existing === undefined) {
            const poll =
              ["Printing", "Paused"].indexOf(printer.status.state) > -1
                ? PRINTER_RUNNING_POLL
                : PRINTER_IDLE_POLL;
            dispatch(setPrinterPollInterval(orgid, printer.id, poll));
            dispatch(
              queueLoadPrinter(
                orgid,
                printer.id,
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

export const setPrinterPollInterval = (orgid, id, interval) => {
  return {
    type: "PRINTERS_POLL_INTERVAL_SET",
    payload: {
      id,
      interval,
    },
  };
};

export const queueLoadPrinter = (orgid, id, fields, delay) => (
  dispatch,
  getState
) => {
  setTimeout(() => {
    const { printers, me } = getState();
    if (me.currentState === "logged-out") {
      return;
    }
    const previousInfo =
      printers.printers && printers.printers.find((p) => p.id === id);
    dispatch(loadPrinter(orgid, id, fields)).then((result) => {
      const { printers } = getState();
      if (printers.checkQueue[id] > 0) {
        let interval = printers.checkQueue[id];
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
          dispatch(setPrinterPollInterval(orgid, id, interval));
        }
        // enqueue next check if result is ok
        if (result.status === 200) {
          dispatch(
            queueLoadPrinter(
              orgid,
              id,
              ["job", "status", "webcam", "lights"],
              interval
            )
          );
        } else {
          dispatch(setPrinterPollInterval(orgid, id, -1));
        }
      }
      return result;
    });
  }, delay);
};

export const loadPrinters = createHttpAction(
  "PRINTERS_LOAD",
  (orgid, fields = [], { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orgid, getState, () => {
      return retryIfUnauthorized(backend.getPrinters, dispatch)(
        orgid,
        fields
      );
    });
  }
);

export const loadPrintersOld = createHttpAction(
  "PRINTERS_LOAD",
  (orgid, fields = [], { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orgid, getState, () => {
      return retryIfUnauthorized(backend.getPrinters, dispatch)(
        orgid,
        fields
      );
    });
  }
);

export const loadPrinter = createHttpAction(
  "PRINTERS_LOAD_DETAIL",
  (orgid, id, fields = [], { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orgid, getState, () => {
      return retryIfUnauthorized(backend.getPrinter, dispatch)(
        orgid,
        id,
        fields
      );
    });
  }
);

export const setWebcamRefreshInterval = (orgid, id, interval) => (
  dispatch,
  getState
) => {
  const { webcams } = getState();
  if (webcams.queue && webcams.queue[id] === undefined) {
    // we need to delay this so interval_set is run before
    const timeout = setTimeout(
      () => dispatch(getWebcamSnapshot(orgid, id)),
      300
    );
    return dispatch({
      type: "WEBCAMS_TIMEOUT_SET",
      payload: {
        id,
        interval: interval > 0 ? interval : 60 * 1000,
        timeout,
      },
    });
  }
  if (webcams.queue[id].interval > interval) {
    clearTimeout(webcams.queue[id].timeout);
    // we need to delay this so interval_set is run before
    const timeout = setTimeout(
      () => dispatch(getWebcamSnapshot(orgid, id)),
      300
    );
    return dispatch({
      type: "WEBCAMS_TIMEOUT_SET",
      payload: {
        id,
        interval: interval > 0 ? interval : 60 * 1000,
        timeout,
      },
    });
  }
  if (webcams.queue[id].interval !== interval) {
    return dispatch({
      type: "WEBCAMS_INTERVAL_SET",
      payload: {
        id,
        interval: interval > 0 ? interval : 60 * 1000,
      },
    });
  }
};

export const getWebcamSnapshot = createHttpAction(
  "WEBCAMS_GET_SNAPSHOT",
  (orgid, id, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orgid, getState, () => {
      let { printers } = getState();

      // This can happen during organization switching and printer's detail opened. Just catch it silently.
      if (printers.activeOrganizationId !== orgid) {
        return Promise.reject(new OrganizationMismatchError());
      }

      const printer = printers.printers.find((p) => p.id === id);

      if (!printer || !printer.webcam || !printer.webcam.url) {
        return Promise.reject(new StreamUnavailableError());
      }

      return retryIfUnauthorized(
        backend.getWebcamSnapshot,
        dispatch
      )(printer.webcam.url).then((r) => {
        let { webcams } = getState();
        if (webcams.queue && webcams.queue[id]) {
          const timeoutData = webcams.queue[id];

          if (timeoutData.interval > 0) {
            const timeout = setTimeout(
              () => dispatch(getWebcamSnapshot(orgid, id)),
              timeoutData.interval
            );

            dispatch({
              type: "WEBCAMS_TIMEOUT_SET",
              payload: {
                id,
                interval: timeoutData.interval,
                timeout,
              },
            });
          }
        }
        return {
          organizationId: orgid,
          id,
          status: r.status,
          ...r.data,
          successCodes: [200],
        };
      });
    }).catch((err) => {
      if (err instanceof StreamUnavailableError) {
        //we got 404 from server - this means Karmen has no url to get stream from printer
        //so we just return 404 to snapshots array so stream renderer can tell this to the user
        //and we stop trying to get images
        return {
          organizationId: orgid,
          id,
          status: 404,
        };
      }
      if (err instanceof OrganizationMismatchError) {
        return;
      }

      if (err instanceof FailedToFetchDataError) {
        //For various reasons (changing wifi, browser suspended tab on mobile, bad connection, etc), single request can fail to fetch.
        //This causes the stream to freeze, throws generic error toaster and user has to reload the page.
        //If we catch this case and dispatch another request after few second, we are very likely to overcome
        //this gap and go on like nothing happen
        //We don't have to worry about offline states - if heartbeat fails, all requests get's killed
        setTimeout(() => dispatch(getWebcamSnapshot(orgid, id)), 5000);
        //We also return 502 to snapshots array, so the stream renderer components displays "retrying" message.
        return {
          organizationId: orgid,
          id,
          status: 502,
        };
      }

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
