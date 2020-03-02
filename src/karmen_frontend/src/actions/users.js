import { createActionThunk } from "redux-thunk-actions";
import * as backend from "../services/backend";
import { retryIfUnauthorized } from "./users-me";

export const clearUsers = () => dispatch => {
  return dispatch({
    type: "USERS_CLEAR"
  });
};

export const getUsers = createActionThunk(
  "USERS_LOAD",
  (orguuid, fields = [], { dispatch, getState }) => {
    const { users } = getState();
    if (!users.me.organizations || !users.me.organizations[orguuid]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.getUsers, dispatch)(
      orguuid,
      fields
    ).then(r => {
      return {
        status: r.status,
        data: r.data
      };
    });
  }
);

export const addUser = createActionThunk(
  "USERS_ADD",
  (orguuid, email, role, { dispatch, getState }) => {
    const { users } = getState();
    if (!users.me.organizations || !users.me.organizations[orguuid]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.addUser, dispatch)(orguuid, email, role);
  }
);

export const patchUser = createActionThunk(
  "USERS_EDIT",
  (orguuid, uuid, role, { dispatch, getState }) => {
    const { users } = getState();
    if (!users.me.organizations || !users.me.organizations[orguuid]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.patchUser, dispatch)(
      orguuid,
      uuid,
      role
    );
  }
);

export const deleteUser = createActionThunk(
  "USERS_DELETE",
  (orguuid, uuid, { dispatch, getState }) => {
    const { users } = getState();
    if (!users.me.organizations || !users.me.organizations[orguuid]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.deleteUser, dispatch)(orguuid, uuid);
  }
);
