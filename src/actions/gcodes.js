import { createHttpAction } from "./utils";
import * as backend from "../services/backend";
import { retryIfUnauthorized, denyWithNoOrganizationAccess } from "./users-me";

export const clearGcodesPages = (printerId) => (dispatch) => {
  return dispatch({
    type: "GCODES_CLEAR_PAGES",
    payload: {},
  });
};

export const getGcodesPage = createHttpAction(
  "GCODES_LOAD_PAGE",
  (
    orgid,
    startWith = null,
    orderBy = null,
    filter = null,
    limit = 15,
    fields = [],
    { dispatch, getState }
  ) => {
    return denyWithNoOrganizationAccess(orgid, getState, () =>
      retryIfUnauthorized(backend.getGcodes, dispatch)(
        orgid,
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
  (orgid, id, fields = [], { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orgid, getState, () => {
      return retryIfUnauthorized(backend.getGcode, dispatch)(orgid, id, fields);
    });
  }
);

export const deleteGcode = createHttpAction(
  "GCODES_DELETE",
  (orgid, id, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orgid, getState, () => {
      return retryIfUnauthorized(backend.deleteGcode, dispatch)(orgid, id);
    });
  }
);

export const uploadGcode = createHttpAction(
  "GCODES_UPLOAD",
  (orgid, toUpload, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orgid, getState, () => {
      return retryIfUnauthorized(backend.uploadGcode, dispatch)(
        orgid,
        toUpload
      );
    });
  }
);

export const getGcodeDownloadUrl = (orgid, id) => (dispatch) => {
  return dispatch(loadGcode(orgid, id, [])).then((r) => {
    let downloadPath = r.data.links[0].href;
    if (downloadPath[0] === "/") downloadPath = downloadPath.substr(1);
    return downloadPath;
  });
};
