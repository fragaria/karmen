import { createHttpAction } from "../utils";
import * as backend from "../../services/backend";
import { retryIfUnauthorized, denyWithNoOrganizationAccess } from "../users-me";
import {
  HttpError,
  OrganizationMismatchError,
  StreamUnavailableError,
  FailedToFetchDataError,
} from "../../errors";

export const loadPrinters = createHttpAction(
  "PRINTERS_LOAD",
  (orgid, fields = ["client"], { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orgid, getState, () => {
      return retryIfUnauthorized(backend.getPrinters, dispatch)(orgid, fields);
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

  // kill any potential timeout before setting a new one
  // this prevents ghost intervals staying in the background
  if (webcams.queue[id]) {
    clearTimeout(webcams.queue[id].timeout);
  }

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

      return retryIfUnauthorized(
        backend.getWebcamSnapshot,
        dispatch
      )(`printers/${printer.id}/snapshot/`).then((r) => {
        let { webcams } = getState();
        if (webcams.queue && webcams.queue[id]) {
          const timeoutData = webcams.queue[id];

          // kill any potential timeout before setting a new one
          // this prevents ghost intervals staying in the background
          if (webcams.queue[id]) {
            clearTimeout(webcams.queue[id].timeout);
          }

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
