import { createActionThunk } from "redux-thunk-actions";
import * as backend from "../services/backend";

export const loadUserState = createActionThunk("USER_LOAD_STATE", () => {
  return backend.checkCurrentLoginState();
});

export const setCurrentState = currentState => dispatch => {
  const user = backend.getUser();
  if (user.hasFreshToken && currentState === "fresh-token-required") {
    return;
  }
  dispatch({
    type: "USER_SET_CURRENT_STATE",
    payload: {
      currentState: currentState
    }
  });
};

export const authenticate = createActionThunk(
  "USER_AUTHENTICATE",
  (username, password) => {
    return backend.authenticate(username, password);
  }
);

export const changePassword = createActionThunk(
  "USER_CHANGE_PASSWORD",
  (password, new_password, new_password_confirmation) => {
    return backend.changePassword(
      password,
      new_password,
      new_password_confirmation
    );
  }
);

export const clearUserIdentity = () => dispatch => {
  backend.setAccessToken(null);
  backend.setRefreshToken(null);
  dispatch({
    type: "USER_CLEAR"
  });
};

export const setTokenFreshness = createActionThunk(
  "USER_SET_TOKEN_FRESHNESS",
  isFresh => {
    return {
      isFresh
    };
  }
);

export const loadUserApiTokens = createActionThunk(
  "USER_LOAD_API_TOKENS",
  () => {
    return backend.loadApiTokens();
  }
);

export const addUserApiToken = createActionThunk("USER_ADD_API_TOKEN", name => {
  return backend.addApiToken(name);
});

export const deleteUserApiToken = createActionThunk(
  "USER_DELETE_API_TOKEN",
  jti => {
    return backend.deleteApiToken(jti).then(status => {
      if (status !== 204) {
        jti = null;
      }
      return { jti };
    });
  }
);

export const clearUsersPages = () => dispatch => {
  return dispatch({
    type: "USERS_CLEAR_PAGES"
  });
};

export const getUsersPage = createActionThunk(
  "USERS_LOAD_PAGE",
  (startWith = null, orderBy = null, filter = null, limit = 15) => {
    return backend.getUsers(startWith, orderBy, filter, limit).then(r => {
      return {
        status: r.status,
        data: r.data,
        startWith,
        orderBy,
        filter,
        limit
      };
    });
  }
);

export const addUser = createActionThunk(
  "USERS_ADD",
  (username, role, password, passwordConfirmation) => {
    return backend.addUser(username, role, password, passwordConfirmation);
  }
);

export const patchUser = createActionThunk(
  "USERS_EDIT",
  (uuid, role, suspended) => {
    return backend.patchUser(uuid, role, suspended);
  }
);
