import { createActionThunk } from "redux-thunk-actions";
import * as backend from "../services/backend";
import { retryIfUnauthorized } from "./users";

export const clearJobsPages = printerUuid => dispatch => {
  return dispatch({
    type: "JOBS_CLEAR_PAGES",
    payload: {
      printer: printerUuid
    }
  });
};

export const getJobsPage = createActionThunk(
  "JOBS_LOAD_PAGE",
  // TODO Reflect the actual filter attribute
  (
    printerUuid,
    startWith = null,
    orderBy = null,
    filter = null,
    limit = 15,
    { dispatch }
  ) => {
    return retryIfUnauthorized(backend.getPrinterJobs, dispatch)(
      startWith,
      orderBy,
      printerUuid,
      limit
    ).then(r => {
      return {
        status: r.status,
        data: r.data,
        printer: printerUuid,
        startWith,
        orderBy,
        filter: null, // TODO filter is ignored for now
        limit
      };
    });
  }
);
