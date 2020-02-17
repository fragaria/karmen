import dayjs from "dayjs";
import Cookies from "js-cookie";
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
            dispatch(clearUserIdentity());
            return Promise.reject();
          }
        });
      }
      return r;
    });
  };
};

export const loadUserFromToken = token => dispatch => {
  const decoded = jwt_decode(token);
  Cookies.set("access_token_cookie", token);
  Cookies.set("csrf_access_token", decoded.csrf);
  dispatch(
    loadUserData({
      identity: decoded.identity,
      username: decoded.user_claims && decoded.user_claims.username,
      systemRole: "user",
      hasFreshToken: decoded.fresh,
      accessTokenExpiresOn: undefined
    })
  );
};

export const loadUserData = userData => dispatch => {
  dispatch({
    type: "USER_DATA_LOADED",
    payload: {
      data: userData
    }
  });
};

export const loadUserFromLocalStorage = () => dispatch => {
  const profile = backend.getUserProfile();
  // no profile - bail
  if (!profile) {
    return Promise.resolve(dispatch(clearUserIdentity()));
  }
  // try refresh if the expiration is set and near
  if (
    profile.accessTokenExpiresOn &&
    dayjs().isAfter(profile.accessTokenExpiresOn.subtract(90, "seconds"))
  ) {
    return backend.refreshAccessToken().then(r => {
      if (r.status === 200) {
        return Promise.resolve(dispatch(loadUserData(r.data)));
      }
      return Promise.resolve(dispatch(clearUserIdentity()));
    });
  }
  return Promise.resolve(dispatch(loadUserData(profile)));
};

export const authenticate = createActionThunk(
  "USER_AUTHENTICATE",
  (username, password) => {
    return backend.authenticate(username, password);
  }
);

export const authenticateFresh = createActionThunk(
  "USER_AUTHENTICATE_FRESH",
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

export const clearUserIdentity = createActionThunk("USER_CLEAR", () => {
  return backend.logout();
});

export const loadUserApiTokens = createActionThunk(
  "USER_LOAD_API_TOKENS",
  ({ dispatch, getState }) => {
    const { users } = getState();
    return retryIfUnauthorized(
      backend.loadApiTokens,
      dispatch
    )(users.me.activeOrganization);
  }
);

export const addUserApiToken = createActionThunk(
  "USER_ADD_API_TOKEN",
  (name, { dispatch, getState }) => {
    const { users } = getState();
    return retryIfUnauthorized(backend.addApiToken, dispatch)(
      users.me.activeOrganization,
      name
    );
  }
);

export const deleteUserApiToken = createActionThunk(
  "USER_DELETE_API_TOKEN",
  (jti, { dispatch }) => {
    return retryIfUnauthorized(
      backend.deleteApiToken,
      dispatch
    )(jti).then(status => {
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
    { dispatch, getState }
  ) => {
    const { users } = getState();
    return retryIfUnauthorized(backend.getUsers, dispatch)(
      users.me.activeOrganization,
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
  (
    username,
    systemRole,
    password,
    passwordConfirmation,
    { dispatch, getState }
  ) => {
    const { users } = getState();
    return retryIfUnauthorized(backend.addUser, dispatch)(
      users.me.activeOrganization,
      username,
      systemRole,
      password,
      passwordConfirmation
    );
  }
);

export const patchUser = createActionThunk(
  "USERS_EDIT",
  (uuid, systemRole, suspended, { dispatch, getState }) => {
    const { users } = getState();
    return retryIfUnauthorized(backend.patchUser, dispatch)(
      users.me.activeOrganization,
      uuid,
      systemRole,
      suspended
    );
  }
);
