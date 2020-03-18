import { createActionThunk } from "redux-thunk-actions";
import * as backend from "../../services/backend";
import { retryIfUnauthorized, denyWithNoOrganizationAccess } from "../users-me";

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
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
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
      );
    });
  }
);

export const patchPrinter = createActionThunk(
  "PRINTERS_PATCH",
  (orguuid, uuid, data, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.patchPrinter, dispatch)(
        orguuid,
        uuid,
        data
      );
    });
  }
);

export const deletePrinter = createActionThunk(
  "PRINTERS_DELETE",
  (orguuid, uuid, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.deletePrinter, dispatch)(
        orguuid,
        uuid
      ).then(r => {
        if (r.status !== 204) {
          r.uuid = null;
        }
        return r;
      });
    });
  }
);
