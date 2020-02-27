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
  (orgslug, fields = [], { dispatch, getState }) => {
    const { users } = getState();
    if (!users.me.organizations || !users.me.organizations[orgslug]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.getUsers, dispatch)(
      users.me.organizations[orgslug].uuid,
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
  (orgslug, email, role, { dispatch, getState }) => {
    const { users } = getState();
    if (!users.me.organizations || !users.me.organizations[orgslug]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.addUser, dispatch)(
      users.me.organizations[orgslug].uuid,
      email,
      role
    );
  }
);

export const patchUser = createActionThunk(
  "USERS_EDIT",
  (orgslug, uuid, role, { dispatch, getState }) => {
    const { users } = getState();
    if (!users.me.organizations || !users.me.organizations[orgslug]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.patchUser, dispatch)(
      users.me.organizations[orgslug].uuid,
      uuid,
      role
    );
  }
);

export const deleteUser = createActionThunk(
  "USERS_DELETE",
  (orgslug, uuid, { dispatch, getState }) => {
    const { users } = getState();
    if (!users.me.organizations || !users.me.organizations[orgslug]) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.deleteUser, dispatch)(
      users.me.organizations[orgslug].uuid,
      uuid
    );
  }
);
