import { createThunkedAction } from "./utils";
import * as backend from "../services/backend";
import { retryIfUnauthorized, denyWithNoOrganizationAccess } from "./users-me";

export const clearUsers = () => (dispatch) => {
  return dispatch({
    type: "USERS_CLEAR",
  });
};

export const getUsers = createThunkedAction(
  "USERS_LOAD",
  (orguuid, fields = [], { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.getUsers, dispatch)(orguuid, fields);
    });
  }
);

export const addUser = createThunkedAction(
  "USERS_ADD",
  (orguuid, email, role, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.addUser, dispatch)(
        orguuid,
        email,
        role
      );
    });
  }
);

export const patchUser = createThunkedAction(
  "USERS_EDIT",
  (orguuid, uuid, role, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.patchUser, dispatch)(
        orguuid,
        uuid,
        role
      );
    });
  }
);

export const deleteUser = createThunkedAction(
  "USERS_DELETE",
  (orguuid, uuid, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.deleteUser, dispatch)(orguuid, uuid);
    });
  }
);
