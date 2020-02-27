import { createActionThunk } from "redux-thunk-actions";
import * as backend from "../services/backend";
import { retryIfUnauthorized } from "./users-me";

export const enqueueTask = createActionThunk(
  "ENQUEUE_TASK",
  (orgslug, task, opts, { dispatch, getState }) => {
    const { users } = getState();
    if (!users.me.organizations || !users.me.organizations[orgslug]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.enqueueTask, dispatch)(
      users.me.organizations[orgslug].uuid,
      task,
      opts
    ).then(r => {
      return {
        status: r.status
      };
    });
  }
);
