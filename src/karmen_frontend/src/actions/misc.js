import { createActionThunk } from "redux-thunk-actions";
import * as backend from "../services/backend";
import { retryIfUnauthorized } from "./users-me";

export const enqueueTask = createActionThunk(
  "ENQUEUE_TASK",
  (orguuid, task, opts, { dispatch, getState }) => {
    const { me } = getState();
    if (!me.organizations || !me.organizations[orguuid]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.enqueueTask, dispatch)(
      me.organizations[orguuid].uuid,
      task,
      opts
    ).then(r => {
      return {
        status: r.status
      };
    });
  }
);
