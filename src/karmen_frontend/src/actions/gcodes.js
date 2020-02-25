import { createActionThunk } from "redux-thunk-actions";
import * as backend from "../services/backend";
import { retryIfUnauthorized } from "./users-me";

export const clearGcodesPages = printerUuid => dispatch => {
  return dispatch({
    type: "GCODES_CLEAR_PAGES",
    payload: {}
  });
};

export const getGcodesPage = createActionThunk(
  "GCODES_LOAD_PAGE",
  (
    startWith = null,
    orderBy = null,
    filter = null,
    limit = 15,
    fields = [],
    { dispatch, getState }
  ) => {
    const { users } = getState();
    if (!users.me.activeOrganization || !users.me.activeOrganization.uuid) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.getGcodes, dispatch)(
      users.me.activeOrganization.uuid,
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
  }
);

export const loadGcode = createActionThunk(
  "GCODE_LOAD_DETAIL",
  (uuid, fields = [], { dispatch, getState }) => {
    const { users } = getState();
    if (!users.me.activeOrganization || !users.me.activeOrganization.uuid) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.getGcode, dispatch)(
      users.me.activeOrganization.uuid,
      uuid,
      fields
    );
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
  (uuid, { dispatch, getState }) => {
    const { users } = getState();
    if (!users.me.activeOrganization || !users.me.activeOrganization.uuid) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.deleteGcode, dispatch)(
      users.me.activeOrganization.uuid,
      uuid
    ).then(r => {
      if (r.status !== 204) {
        r.data.uuid = null;
      }
      return r;
    });
  }
);

export const uploadGcode = createActionThunk(
  "GCODES_UPLOAD",
  (path, toUpload, { dispatch, getState }) => {
    const { users } = getState();
    if (!users.me.activeOrganization || !users.me.activeOrganization.uuid) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.uploadGcode, dispatch)(
      users.me.activeOrganization.uuid,
      path,
      toUpload
    );
  }
);
