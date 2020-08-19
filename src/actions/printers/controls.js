import { createHttpAction } from "../utils";
import * as backend from "../../services/backend";
import { retryIfUnauthorized, denyWithNoOrganizationAccess } from "../users-me";

export const setPrinterConnection = createHttpAction(
  "PRINTERS_SET_CONNECTION",
  (orguuid, id, state, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.setPrinterConnection, dispatch)(
        orguuid,
        id,
        state
      );
    });
  }
);

export const changeCurrentJob = createHttpAction(
  "PRINTERS_CHANGE_JOB",
  (orguuid, id, action, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.changeCurrentJob, dispatch)(
        orguuid,
        id,
        action
      );
    });
  }
);

export const changeLights = createHttpAction(
  "PRINTERS_CHANGE_LIGHTS",
  (orguuid, id, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.changeLights, dispatch)(orguuid, id);
    });
  }
);

export const movePrinthead = createHttpAction(
  "PRINTERS_MOVE_PRINTHEAD",
  (orguuid, id, command, opts, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.movePrinthead, dispatch)(
        orguuid,
        id,
        command,
        opts
      );
    });
  }
);

export const changeFanState = createHttpAction(
  "PRINTERS_CHANGE_FAN_STATE",
  (orguuid, id, targetState, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.changeFanState, dispatch)(
        orguuid,
        id,
        targetState
      );
    });
  }
);

export const changeMotorsState = createHttpAction(
  "PRINTERS_CHANGE_MOTORS_STATE",
  (orguuid, id, targetState, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.changeMotorsState, dispatch)(
        orguuid,
        id,
        targetState
      );
    });
  }
);

export const extrude = createHttpAction(
  "PRINTERS_EXTRUDE",
  (orguuid, id, amount, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.extrude, dispatch)(
        orguuid,
        id,
        amount
      );
    });
  }
);

export const setTemperature = createHttpAction(
  "PRINTERS_SET_TEMPERATURE",
  (orguuid, id, partName, target, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.setTemperature, dispatch)(
        orguuid,
        id,
        partName,
        target
      );
    });
  }
);

export const startUpdate = createHttpAction(
  "PRINTERS_START_UPDATE",
  (orguuid, id, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.startUpdate, dispatch)(orguuid, id);
    });
  }
);
