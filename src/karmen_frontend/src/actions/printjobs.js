import { createActionThunk } from "redux-thunk-actions";
import * as backend from "../services/backend";
import { retryIfUnauthorized } from "./users-me";

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
    orgslug,
    printerUuid,
    startWith = null,
    orderBy = null,
    filter = null,
    limit = 15,
    { dispatch, getState }
  ) => {
    const { users } = getState();
    if (!users.me.organizations || !users.me.organizations[orgslug]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.getPrinterJobs, dispatch)(
      users.me.organizations[orgslug].uuid,
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

export const addPrintJob = createActionThunk(
  "JOBS_ADD",
  (orgslug, uuid, printer, { dispatch, getState }) => {
    const { users } = getState();
    if (!users.me.organizations || !users.me.organizations[orgslug]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.printGcode, dispatch)(
      users.me.organizations[orgslug].uuid,
      uuid,
      printer
    );
  }
);
