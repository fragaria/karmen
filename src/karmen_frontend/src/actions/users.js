import dayjs from "dayjs";
import jwt_decode from "jwt-decode";
import { createActionThunk } from "redux-thunk-actions";
import * as backend from "../services/backend";

export const loadUserFromToken = (accessToken, refreshToken) => dispatch => {
  dispatch({
    type: "USER_LOADED_FROM_STORAGE",
    payload: {
      access_token: accessToken,
      refresh_token: refreshToken
    }
  });
};

export const loadUserFromLocalStorage = () => dispatch => {
  const accessToken = backend.getAccessToken();
  const refreshToken = backend.getRefreshToken();

  if (accessToken && refreshToken) {
    const decodedAccess = jwt_decode(accessToken);
    const decodedRefresh = jwt_decode(refreshToken);
    if (decodedAccess.exp && decodedRefresh.exp) {
      let accessExpiresAt = dayjs(decodedAccess.exp * 1000);
      let refreshExpiresAt = dayjs(decodedRefresh.exp * 1000);
      if (
        dayjs().isAfter(accessExpiresAt) &&
        dayjs().isAfter(refreshExpiresAt)
      ) {
        return dispatch(clearUserIdentity());
      } else if (dayjs().isAfter(accessExpiresAt.subtract(90, "seconds"))) {
        return backend.refreshAccessToken().then(r => {
          backend.setAccessToken(r.data.access_token);
          return Promise.resolve(
            dispatch(loadUserFromToken(r.data.access_token, refreshToken))
          );
        });
      }
    }
  } else {
    return Promise.resolve(dispatch(clearUserIdentity()));
  }

  return Promise.resolve(
    dispatch(loadUserFromToken(accessToken, refreshToken))
  );
};

export const setCurrentState = currentState => (dispatch, getState) => {
  const { users } = getState();
  const user = users.me;
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

export const refreshToken = createActionThunk(
  "USER_REFRESH_ACCESS_TOKEN",
  (username, password) => {
    return backend.refreshAccessToken();
  }
);

export const changePassword = createActionThunk(
  "USER_CHANGE_PASSWORD",
  (username, password, new_password, new_password_confirmation) => {
    return backend.changePassword(
      username,
      password,
      new_password,
      new_password_confirmation
    );
  }
);

export const clearUserIdentity = () => dispatch => {
  dispatch({
    type: "USER_CLEAR"
  });
};

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
