import { createActionThunk } from "redux-thunk-actions";
import * as backend from "../services/backend";
import { retryIfUnauthorized } from "./users-me";

export const enqueueTask = createActionThunk(
  "ENQUEUE_TASK",
  (task, opts, { dispatch, getState }) => {
    const { users } = getState();
    if (!users.me.activeOrganization || !users.me.activeOrganization.uuid) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.enqueueTask, dispatch)(
      users.me.activeOrganization.uuid,
      task,
      opts
    ).then(r => {
      return {
        status: r.status
      };
    });
  }
);
