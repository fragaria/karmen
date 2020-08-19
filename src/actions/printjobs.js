import { createHttpAction } from "./utils";
import * as backend from "../services/backend";
import { retryIfUnauthorized, denyWithNoOrganizationAccess } from "./users-me";

export const clearJobsPages = (printerId) => (dispatch) => {
  return dispatch({
    type: "JOBS_CLEAR_PAGES",
    payload: {
      printer: printerId,
    },
  });
};

export const getJobsPage = createHttpAction(
  "JOBS_LOAD_PAGE",
  // TODO Reflect the actual filter attribute
  (
    orguuid,
    printerId,
    startWith = null,
    orderBy = null,
    filter = null,
    limit = 15,
    { dispatch, getState }
  ) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.getPrinterJobs, dispatch)(
        orguuid,
        startWith,
        orderBy,
        printerId,
        limit
      );
    });
  }
);

export const addPrintJob = createHttpAction(
  "JOBS_ADD",
  (orguuid, id, printer, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.printGcode, dispatch)(
        orguuid,
        id,
        printer
      );
    });
  }
);
