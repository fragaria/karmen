import { createThunkedAction } from "./utils";
import * as backend from "../services/backend";
import { retryIfUnauthorized, denyWithNoOrganizationAccess } from "./users-me";

export const clearGcodesPages = (printerUuid) => (dispatch) => {
  return dispatch({
    type: "GCODES_CLEAR_PAGES",
    payload: {},
  });
};

export const getGcodesPage = createThunkedAction(
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
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.getGcodes, dispatch)(
        orguuid,
        startWith,
        orderBy,
        filter,
        limit,
        fields
      );
    });
  }
);

export const loadGcode = createThunkedAction(
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

export const downloadGcode = createThunkedAction(
  "GCODE_DOWNLOAD_DETAIL",
  (data, filename, { dispatch }) => {
    return retryIfUnauthorized(backend.downloadGcode, dispatch)(data, filename);
  }
);

export const deleteGcode = createThunkedAction(
  "GCODES_DELETE",
  (orguuid, uuid, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.deleteGcode, dispatch)(orguuid, uuid);
    });
  }
);

export const uploadGcode = createThunkedAction(
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
