import { createHttpAction } from "./utils";
import * as backend from "../services/backend";
import { retryIfUnauthorized, denyWithNoOrganizationAccess } from "./users-me";

export const enqueueTask = createHttpAction(
  "ENQUEUE_TASK",
  (orguuid, task, opts, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.enqueueTask, dispatch)(
        orguuid,
        task,
        opts
      );
    });
  }
);
