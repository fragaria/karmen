import { createActionThunk } from "redux-thunk-actions";
import * as backend from "../services/backend";

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
    limit = 15
  ) => {
    return backend
      .getPrinterJobs(startWith, orderBy, printerUuid, limit)
      .then(r => {
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
