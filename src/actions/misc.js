import { createHttpAction } from "./utils";
import * as backend from "../services/backend";
import { retryIfUnauthorized, denyWithNoOrganizationAccess } from "./users-me";

export const enqueueTask = createHttpAction(
  "ENQUEUE_TASK",
  (orgid, task, opts, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orgid, getState, () => {
      return retryIfUnauthorized(backend.enqueueTask, dispatch)(
        orgid,
        task,
        opts
      );
    });
  }
);
