import { createHttpAction } from "../utils";
import * as backend from "../../services/backend";
import { retryIfUnauthorized, denyWithNoOrganizationAccess } from "../users-me";

export const setPrinterConnection = createHttpAction(
  "PRINTERS_SET_CONNECTION",
  (orguuid, uuid, state, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.setPrinterConnection, dispatch)(
        orguuid,
        uuid,
        state
      );
    });
  }
);

export const changeCurrentJob = createHttpAction(
  "PRINTERS_CHANGE_JOB",
  (orguuid, uuid, action, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.changeCurrentJob, dispatch)(
        orguuid,
        uuid,
        action
      );
    });
  }
);

export const changeLights = createHttpAction(
  "PRINTERS_CHANGE_LIGHTS",
  (orguuid, uuid, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.changeLights, dispatch)(orguuid, uuid);
    });
  }
);

export const movePrinthead = createHttpAction(
  "PRINTERS_MOVE_PRINTHEAD",
  (orguuid, uuid, command, opts, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.movePrinthead, dispatch)(
        orguuid,
        uuid,
        command,
        opts
      );
    });
  }
);

export const changeFanState = createHttpAction(
  "PRINTERS_CHANGE_FAN_STATE",
  (orguuid, uuid, targetState, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.changeFanState, dispatch)(
        orguuid,
        uuid,
        targetState
      );
    });
  }
);

export const changeMotorsState = createHttpAction(
  "PRINTERS_CHANGE_MOTORS_STATE",
  (orguuid, uuid, targetState, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.changeMotorsState, dispatch)(
        orguuid,
        uuid,
        targetState
      );
    });
  }
);

export const extrude = createHttpAction(
  "PRINTERS_EXTRUDE",
  (orguuid, uuid, amount, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.extrude, dispatch)(
        orguuid,
        uuid,
        amount
      );
    });
  }
);

export const setTemperature = createHttpAction(
  "PRINTERS_SET_TEMPERATURE",
  (orguuid, uuid, partName, target, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.setTemperature, dispatch)(
        orguuid,
        uuid,
        partName,
        target
      );
    });
  }
);

export const startUpdate = createHttpAction(
  "PRINTERS_START_UPDATE",
  (orguuid, uuid, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.startUpdate, dispatch)(orguuid, uuid);
    });
  }
);
