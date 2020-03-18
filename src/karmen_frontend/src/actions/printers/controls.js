import { createActionThunk } from "redux-thunk-actions";
import * as backend from "../../services/backend";
import { retryIfUnauthorized } from "../users-me";

export const setPrinterConnection = createActionThunk(
  "PRINTERS_SET_CONNECTION",
  (orguuid, uuid, state, { dispatch, getState }) => {
    const { me } = getState();
    if (!me.organizations || !me.organizations[orguuid]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.setPrinterConnection, dispatch)(
      orguuid,
      uuid,
      state
    );
  }
);

export const changeCurrentJob = createActionThunk(
  "PRINTERS_CHANGE_JOB",
  (orguuid, uuid, action, { dispatch, getState }) => {
    const { me } = getState();
    if (!me.organizations || !me.organizations[orguuid]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.changeCurrentJob, dispatch)(
      orguuid,
      uuid,
      action
    );
  }
);

export const changeLights = createActionThunk(
  "PRINTERS_CHANGE_LIGHTS",
  (orguuid, uuid, { dispatch, getState }) => {
    const { me } = getState();
    if (!me.organizations || !me.organizations[orguuid]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.changeLights, dispatch)(orguuid, uuid);
  }
);
