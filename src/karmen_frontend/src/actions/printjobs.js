import { createActionThunk } from "redux-thunk-actions";
import * as backend from "../services/backend";

export const clearJobsPages = printerHost => dispatch => {
  return dispatch({
    type: "JOBS_CLEAR_PAGES",
    payload: {
      printer: printerHost
    }
  });
};

export const getJobsPage = createActionThunk(
  "JOBS_LOAD_PAGE",
  // TODO Reflect the actual filter attribute
  (
    printerHost,
    startWith = null,
    orderBy = null,
    filter = null,
    limit = 15
  ) => {
    return backend
      .getPrinterJobs(startWith, orderBy, printerHost, limit)
      .then(r => {
        return {
          status: r.status,
          data: r.data,
          printer: printerHost,
          startWith,
          orderBy,
          filter: null, // TODO filter is ignored for now
          limit
        };
      });
  }
);
