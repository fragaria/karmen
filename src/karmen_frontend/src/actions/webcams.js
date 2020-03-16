import { createActionThunk } from "redux-thunk-actions";
import * as backend from "../services/backend";
import { retryIfUnauthorized } from "./users-me";

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
        timeout
      }
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
        timeout
      }
    });
  }
  if (webcams.queue[uuid].interval !== interval) {
    return dispatch({
      type: "WEBCAMS_INTERVAL_SET",
      payload: {
        uuid,
        interval: interval > 0 ? interval : 60 * 1000
      }
    });
  }
};

export const getWebcamSnapshot = createActionThunk(
  "WEBCAMS_GET_SNAPSHOT",
  (orguuid, uuid, { dispatch, getState }) => {
    let { printers, me } = getState();
    const printer = printers.printers.find(p => p.uuid === uuid);
    if (!me.organizations || !me.organizations[orguuid]) {
      return Promise.resolve({});
    }
    if (!printer || !printer.webcam || !printer.webcam.url) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(
      backend.getWebcamSnapshot,
      dispatch
    )(printer.webcam.url).then(r => {
      if (r.status === 202 || r.status === 200) {
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
                timeout
              }
            });
          }
        }
      }
      if (r.data && r.data.prefix && r.data.data) {
        return {
          organizationUuid: orguuid,
          uuid,
          status: r.status,
          ...r.data
        };
      }
      return {
        organizationUuid: orguuid,
        uuid,
        status: r.status
      };
    });
  }
);
