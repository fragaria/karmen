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

export const movePrinthead = createActionThunk(
  "PRINTERS_MOVE_PRINTHEAD",
  (orguuid, uuid, command, opts, { dispatch, getState }) => {
    const { me } = getState();
    if (!me.organizations || !me.organizations[orguuid]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.movePrinthead, dispatch)(
      orguuid,
      uuid,
      command,
      opts
    );
  }
);

export const changeFanState = createActionThunk(
  "PRINTERS_CHANGE_FAN_STATE",
  (orguuid, uuid, targetState, { dispatch, getState }) => {
    const { me } = getState();
    if (!me.organizations || !me.organizations[orguuid]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.changeFanState, dispatch)(
      orguuid,
      uuid,
      targetState
    );
  }
);

export const changeMotorsState = createActionThunk(
  "PRINTERS_CHANGE_MOTORS_STATE",
  (orguuid, uuid, targetState, { dispatch, getState }) => {
    const { me } = getState();
    if (!me.organizations || !me.organizations[orguuid]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.changeMotorsState, dispatch)(
      orguuid,
      uuid,
      targetState
    );
  }
);

export const extrude = createActionThunk(
  "PRINTERS_EXTRUDE",
  (orguuid, uuid, amount, { dispatch, getState }) => {
    const { me } = getState();
    if (!me.organizations || !me.organizations[orguuid]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.extrude, dispatch)(
      orguuid,
      uuid,
      amount
    );
  }
);

export const setTemperature = createActionThunk(
  "PRINTERS_SET_TEMPERATURE",
  (orguuid, uuid, partName, amount, { dispatch, getState }) => {
    const { me } = getState();
    if (!me.organizations || !me.organizations[orguuid]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.setTemperature, dispatch)(
      orguuid,
      uuid,
      partName,
      amount
    );
  }
);
