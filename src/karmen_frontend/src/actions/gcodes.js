import { createActionThunk } from "redux-thunk-actions";
import * as backend from "../services/backend";
import { retryIfUnauthorized, denyWithNoOrganizationAccess } from "./users-me";

export const clearGcodesPages = printerUuid => dispatch => {
  return dispatch({
    type: "GCODES_CLEAR_PAGES",
    payload: {}
  });
};

export const getGcodesPage = createActionThunk(
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
      ).then(r => {
        return {
          status: r.status,
          data: r.data,
          startWith,
          orderBy,
          filter,
          limit,
          fields
        };
      });
    });
  }
);

export const loadGcode = createActionThunk(
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

export const downloadGcode = createActionThunk(
  "GCODE_DOWNLOAD_DETAIL",
  (data, filename, { dispatch }) => {
    return retryIfUnauthorized(backend.downloadGcode, dispatch)(data, filename);
  }
);

export const deleteGcode = createActionThunk(
  "GCODES_DELETE",
  (orguuid, uuid, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.deleteGcode, dispatch)(
        orguuid,
        uuid
      ).then(r => {
        if (r.status !== 204) {
          r.data.uuid = null;
        }
        return r;
      });
    });
  }
);

export const uploadGcode = createActionThunk(
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
