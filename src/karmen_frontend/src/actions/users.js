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
  (fields = [], { dispatch, getState }) => {
    const { users } = getState();
    if (!users.me.activeOrganization || !users.me.activeOrganization.uuid) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.getUsers, dispatch)(
      users.me.activeOrganization.uuid,
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
  (username, role, { dispatch, getState }) => {
    const { users } = getState();
    if (!users.me.activeOrganization || !users.me.activeOrganization.uuid) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.addUser, dispatch)(
      users.me.activeOrganization.uuid,
      username,
      role
    );
  }
);

export const patchUser = createActionThunk(
  "USERS_EDIT",
  (uuid, role, { dispatch, getState }) => {
    const { users } = getState();
    if (!users.me.activeOrganization || !users.me.activeOrganization.uuid) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.patchUser, dispatch)(
      users.me.activeOrganization.uuid,
      uuid,
      role
    );
  }
);

export const deleteUser = createActionThunk(
  "USERS_DELETE",
  (uuid, { dispatch, getState }) => {
    const { users } = getState();
    if (!users.me.activeOrganization || !users.me.activeOrganization.uuid) {
      return Promise.resolve({});
    }
    return retryIfUnauthorized(backend.deleteUser, dispatch)(
      users.me.activeOrganization.uuid,
      uuid
    );
  }
);
