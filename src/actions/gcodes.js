import { createHttpAction } from "./utils";
import * as backend from "../services/backend";
import { retryIfUnauthorized, denyWithNoOrganizationAccess } from "./users-me";

const BASE_URL = window.env.BACKEND_BASE;

export const clearGcodesPages = (printerUuid) => (dispatch) => {
  return dispatch({
    type: "GCODES_CLEAR_PAGES",
    payload: {},
  });
};

export const getGcodesPage = createHttpAction(
  "GCODES_LOAD_PAGE",
  (
    orguuid,
    startWith = null,
    orderBy = null,
    filter = null,
    limit = 15,
    fields = [],
    { dispatch, getState }
  ) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () =>
      retryIfUnauthorized(backend.getGcodes, dispatch)(
        orguuid,
        startWith,
        orderBy,
        filter,
        limit,
        fields
      )
    );
  }
);

export const loadGcode = createHttpAction(
  "GCODE_LOAD_DETAIL",
  (orguuid, uuid, fields = [], { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.getGcode, dispatch)(
        orguuid,
        uuid,
        fields
      );
    });
  }
);

export const deleteGcode = createHttpAction(
  "GCODES_DELETE",
  (orguuid, uuid, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.deleteGcode, dispatch)(orguuid, uuid);
    });
  }
);

export const uploadGcode = createHttpAction(
  "GCODES_UPLOAD",
  (orguuid, path, toUpload, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.uploadGcode, dispatch)(
        orguuid,
        path,
        toUpload
      );
    });
  }
);

export const getGcodeDownloadUrl = (orguuid, id) => (dispatch) => {
  return dispatch(loadGcode(orguuid, id, [])).then((r) => {
    let downloadPath = r.data.data;
    if (downloadPath[0] === "/") downloadPath = downloadPath.substr(1);
    return `${BASE_URL}/${downloadPath}`;
  });
};
