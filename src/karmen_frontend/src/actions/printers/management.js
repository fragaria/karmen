import { createHttpAction } from "../utils";
import * as backend from "../../services/backend";
import { retryIfUnauthorized, denyWithNoOrganizationAccess } from "../users-me";

export const addPrinter = createHttpAction(
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

export const patchPrinter = createHttpAction(
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

export const deletePrinter = createHttpAction(
  "PRINTERS_DELETE",
  (orguuid, uuid, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.deletePrinter, dispatch)(
        orguuid,
        uuid
      );
    });
  }
);

export const issuePrinterToken = createHttpAction(
  "PRINTERS_ISSUE_TOKEN",
  (orguuid, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.issuePrinterToken, dispatch)(orguuid);
    }).then(({ data }) => data.token);
  }
);
