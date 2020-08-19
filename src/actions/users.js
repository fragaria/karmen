import { createHttpAction } from "./utils";
import * as backend from "../services/backend";
import { retryIfUnauthorized, denyWithNoOrganizationAccess } from "./users-me";

export const clearUsers = () => (dispatch) => {
  return dispatch({
    type: "USERS_CLEAR",
  });
};

export const getUsers = createHttpAction(
  "USERS_LOAD",
  (orguuid, fields = [], { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.getUsers, dispatch)(orguuid, fields);
    });
  }
);

export const addUser = createHttpAction(
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

export const patchUser = createHttpAction(
  "USERS_EDIT",
  (orguuid, id, role, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.patchUser, dispatch)(
        orguuid,
        id,
        role
      );
    });
  }
);

export const deleteUser = createHttpAction(
  "USERS_DELETE",
  (orguuid, id, { dispatch, getState }) => {
    return denyWithNoOrganizationAccess(orguuid, getState, () => {
      return retryIfUnauthorized(backend.deleteUser, dispatch)(orguuid, id);
    });
  }
);
