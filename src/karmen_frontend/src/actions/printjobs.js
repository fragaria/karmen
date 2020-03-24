import { createThunkedAction } from "./utils";
import * as backend from "../services/backend";
import { retryIfUnauthorized, denyWithNoOrganizationAccess } from "./users-me";

export const clearJobsPages = (printerUuid) => (dispatch) => {
  return dispatch({
    type: "JOBS_CLEAR_PAGES",
    payload: {
      printer: printerUuid,
    },
  });
};

export const getJobsPage = createThunkedAction(
  "JOBS_LOAD_PAGE",
  // TODO Reflect the actual filter attribute
  (
    orguuid,
    printerUuid,
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
        printerUuid,
        limit
      );
    });
  }
);

export const addPrintJob = createThunkedAction(
  "JOBS_ADD",
  (orguuid, uuid, printer, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.printGcode, dispatch)(
        orguuid,
        uuid,
        printer
      );
    });
  }
);
