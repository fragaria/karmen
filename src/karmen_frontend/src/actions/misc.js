import { createActionThunk } from "redux-thunk-actions";
import * as backend from "../services/backend";
import { retryIfUnauthorized, denyWithNoOrganizationAccess } from "./users-me";

export const enqueueTask = createActionThunk(
  "ENQUEUE_TASK",
  (orguuid, task, opts, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.enqueueTask, dispatch)(
        orguuid,
        task,
        opts
      ).then(r => {
        return {
          status: r.status
        };
      });
    });
  }
);
