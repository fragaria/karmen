import { createActionThunk } from "redux-thunk-actions";
import * as backend from "../../services/backend";
import { retryIfUnauthorized } from "../users-me";

export const addPrinter = createActionThunk(
  "PRINTERS_ADD",
  (
    orguuid,
    protocol,
    hostname,
    ip,
    port,
    path,
    token,
    name,
    apiKey,
    { dispatch, getState }
  ) => {
    const { me } = getState();
    if (!me.organizations || !me.organizations[orguuid]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.addPrinter, dispatch)(
      orguuid,
      protocol,
      hostname,
      ip,
      port,
      path,
      token,
      name,
      apiKey
    ).then(data => {
      return Object.assign(data, {
        organizationUuid: orguuid
      });
    });
  }
);

export const patchPrinter = createActionThunk(
  "PRINTERS_PATCH",
  (orguuid, uuid, data, { dispatch, getState }) => {
    const { me } = getState();
    if (!me.organizations || !me.organizations[orguuid]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.patchPrinter, dispatch)(
      orguuid,
      uuid,
      data
    ).then(data => {
      return Object.assign(data, {
        organizationUuid: orguuid
      });
    });
  }
);

export const deletePrinter = createActionThunk(
  "PRINTERS_DELETE",
  (orguuid, uuid, { dispatch, getState }) => {
    const { me } = getState();
    if (!me.organizations || !me.organizations[orguuid]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.deletePrinter, dispatch)(
      orguuid,
      uuid
    ).then(r => {
      if (r.status !== 204) {
        r.data.uuid = null;
      }
      return r;
    });
  }
);
