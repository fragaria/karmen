import dayjs from "dayjs";
import jwt_decode from "jwt-decode";
import { createActionThunk } from "redux-thunk-actions";
import * as backend from "../services/backend";

export const retryIfUnauthorized = (func, dispatch) => {
  return (...args) => {
    return func(...args).then(r => {
      if (r.status === 401) {
        if (!dispatch) {
          return Promise.reject();
        }
        return dispatch(refreshToken()).then(r => {
          if (r.status === 200) {
            return func(...args);
          } else {
            return dispatch(clearUserIdentity);
          }
        });
      }
      return r;
    });
  };
};

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
  // no tokens - bail
  if (!accessToken && !refreshToken) {
    return Promise.resolve(dispatch(clearUserIdentity()));
  }

  // refresh AND access
  if (accessToken && refreshToken) {
    const decodedAccess = jwt_decode(accessToken);
    const decodedRefresh = jwt_decode(refreshToken);
    if (decodedAccess.exp && decodedRefresh.exp) {
      let accessExpiresAt = dayjs(decodedAccess.exp * 1000);
      let refreshExpiresAt = dayjs(decodedRefresh.exp * 1000);
      // both tokens are expired
      if (
        dayjs().isAfter(accessExpiresAt) &&
        dayjs().isAfter(refreshExpiresAt)
      ) {
        return Promise.resolve(dispatch(clearUserIdentity()));
        // access token will expire shortly - do refresh
      } else if (dayjs().isAfter(accessExpiresAt.subtract(90, "seconds"))) {
        return backend.refreshAccessToken().then(r => {
          backend.setAccessToken(r.data.access_token);
          return Promise.resolve(
            dispatch(loadUserFromToken(r.data.access_token, refreshToken))
          );
        });
      }
    } else {
      return Promise.resolve(dispatch(clearUserIdentity()));
    }
  }

  if (accessToken && !refreshToken) {
    const decodedAccess = jwt_decode(accessToken);
    // Having expirable access token and no refresh token should not happen - but we can handle a valid access token nonetheless
    if (decodedAccess.exp) {
      let accessExpiresAt = dayjs(decodedAccess.exp * 1000);
      if (dayjs().isAfter(accessExpiresAt)) {
        return Promise.resolve(dispatch(clearUserIdentity()));
      }
      // probably eternal token without expiration
    } else {
      return Promise.resolve(
        dispatch(loadUserFromToken(accessToken, refreshToken))
      );
    }
  }

  return Promise.resolve(
    dispatch(loadUserFromToken(accessToken, refreshToken))
  );
};

export const authenticate = createActionThunk(
  "USER_AUTHENTICATE",
  (username, password) => {
    return backend.authenticate(username, password);
  }
);

export const authenticateFresh = createActionThunk(
  "USER_AUTHENTICATE",
  (username, password) => {
    return backend.authenticateFresh(username, password);
  }
);

export const refreshToken = createActionThunk(
  "USER_REFRESH_ACCESS_TOKEN",
  () => {
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
  (
    startWith = null,
    orderBy = null,
    filter = null,
    limit = 15,
    { dispatch }
  ) => {
    return retryIfUnauthorized(backend.getUsers, dispatch)(
      startWith,
      orderBy,
      filter,
      limit
    ).then(r => {
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
  (username, role, password, passwordConfirmation, { dispatch }) => {
    return retryIfUnauthorized(backend.addUser, dispatch)(
      username,
      role,
      password,
      passwordConfirmation
    );
  }
);

export const patchUser = createActionThunk(
  "USERS_EDIT",
  (uuid, role, suspended, { dispatch }) => {
    return retryIfUnauthorized(backend.patchUser, dispatch)(
      uuid,
      role,
      suspended
    );
  }
);
