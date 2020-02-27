import { createActionThunk } from "redux-thunk-actions";
import * as backend from "../services/backend";
import { retryIfUnauthorized } from "./users-me";

export const clearOrganizations = () => dispatch => {
  return dispatch({
    type: "ORGANIZATIONS_CLEAR"
  });
};

export const getOrganizations = createActionThunk(
  "ORGANIZATIONS_LOAD",
  ({ dispatch, getState }) => {
    return retryIfUnauthorized(backend.getOrganizations, dispatch)();
  }
);

export const addOrganization = createActionThunk(
  "ORGANIZATIONS_ADD",
  (name, { dispatch, getState }) => {
    return retryIfUnauthorized(backend.addOrganization, dispatch)(name);
  }
);

export const patchOrganization = createActionThunk(
  "ORGANIZATIONS_EDIT",
  (uuid, name, { dispatch, getState }) => {
    return retryIfUnauthorized(backend.patchOrganization, dispatch)(uuid, name);
  }
);
