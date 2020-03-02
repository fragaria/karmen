import { createActionThunk } from "redux-thunk-actions";
import * as backend from "../services/backend";
import { retryIfUnauthorized } from "./users-me";

export const enqueueTask = createActionThunk(
  "ENQUEUE_TASK",
  (orguuid, task, opts, { dispatch, getState }) => {
    const { users } = getState();
    if (!users.me.organizations || !users.me.organizations[orguuid]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.enqueueTask, dispatch)(
      users.me.organizations[orguuid].uuid,
      task,
      opts
    ).then(r => {
      return {
        status: r.status
      };
    });
  }
);
