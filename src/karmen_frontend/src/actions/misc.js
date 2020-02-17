import { createActionThunk } from "redux-thunk-actions";
import * as backend from "../services/backend";
import { retryIfUnauthorized } from "./users";

export const enqueueTask = createActionThunk(
  "ENQUEUE_TASK",
  (task, opts, { dispatch, getState }) => {
    const { users } = getState();
    return retryIfUnauthorized(backend.enqueueTask, dispatch)(
      users.me.activeOrganization,
      task,
      opts
    ).then(r => {
      return {
        status: r.status
      };
    });
  }
);
