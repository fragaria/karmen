import dayjs from "dayjs";
import Cookies from "js-cookie";
import jwt_decode from "jwt-decode";
import { createThunkedAction } from "./utils";
import * as backend from "../services/backend";

export const retryIfUnauthorized = (func, dispatch) => {
  return (...args) => {
    return func(...args).then((r) => {
      if (r.status === 401) {
        if (!dispatch) {
          return Promise.reject();
        }
        return dispatch(refreshToken()).then((r) => {
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

export const denyWithNoOrganizationAccess = (orguuid, getState, wrapped) => {
  const { me } = getState();
  if (!me.organizations || !me.organizations[orguuid]) {
    return Promise.reject();
  }
  return wrapped();
};

export const loadUserFromToken = (token) => (dispatch) => {
  const decoded = jwt_decode(token);
  Cookies.set("access_token_cookie", token);
  Cookies.set("csrf_access_token", decoded.csrf);
  dispatch(
    loadUserData({
      identity: decoded.identity,
      username: decoded.user_claims && decoded.user_claims.username,
      email: decoded.user_claims && decoded.user_claims.email,
      organizations: {
        [decoded.user_claims && decoded.user_claims.organization_uuid]: {
          role: "user",
          uuid: decoded.user_claims && decoded.user_claims.organization_uuid,
          name: decoded.user_claims && decoded.user_claims.organization_name,
        },
      },
      systemRole: "user",
      hasFreshToken: decoded.fresh,
      accessTokenExpiresOn: undefined,
    })
  );
};

export const loadUserFromLocalStorage = (force_refresh = false) => (
  dispatch
) => {
  const profile = backend.getUserProfile();
  // no profile - bail
  if (!profile) {
    return Promise.resolve(dispatch(clearUserIdentity()));
  }
  // try refresh if the expiration is set and near
  if (
    (profile.accessTokenExpiresOn &&
      dayjs().isAfter(profile.accessTokenExpiresOn.subtract(90, "seconds"))) ||
    force_refresh
  ) {
    return backend.refreshAccessToken().then((r) => {
      if (r.status === 200) {
        return Promise.resolve(dispatch(loadUserData(r.data)));
      }
      return Promise.resolve(dispatch(clearUserIdentity()));
    });
  }
  return Promise.resolve(dispatch(loadUserData(profile)));
};

export const switchOrganization = (uuid) => (dispatch) => {
  dispatch({
    type: "USER_SWITCH_ORGANIZATION",
    payload: {
      data: {
        uuid,
      },
    },
  });
};

export const loadUserData = (userData) => (dispatch) => {
  dispatch({
    type: "USER_DATA_LOADED",
    payload: {
      data: userData,
    },
  });
  if (userData.activeOrganization) {
    dispatch(switchOrganization(userData.activeOrganization.uuid));
  } else {
    const prefs = backend.getUserPreferences();
    if (
      prefs &&
      prefs.activeOrganizationUuid &&
      userData.organizations[prefs.activeOrganizationUuid]
    ) {
      dispatch(switchOrganization(prefs.activeOrganizationUuid));
    } else {
      const org =
        userData.organizations && Object.values(userData.organizations)[0];
      dispatch(switchOrganization(org.uuid));
    }
  }
};

export const authenticate = createThunkedAction(
  "USER_AUTHENTICATE",
  (username, password) => {
    return backend.authenticate(username, password);
  }
);

export const authenticateFresh = createThunkedAction(
  "USER_AUTHENTICATE_FRESH",
  (username, password) => {
    return backend.authenticateFresh(username, password);
  }
);

export const refreshToken = createThunkedAction(
  "USER_REFRESH_ACCESS_TOKEN",
  () => {
    return backend.refreshAccessToken();
  }
);

export const changePassword = createThunkedAction(
  "USER_CHANGE_PASSWORD",
  (
    password,
    new_password,
    new_password_confirmation,
    { dispatch, getState }
  ) => {
    const { me } = getState();
    return dispatch(authenticateFresh(me.username, password)).then((r) => {
      if (r.status !== 200) {
        return Promise.reject();
      }
      return backend.changePassword(
        password,
        new_password,
        new_password_confirmation
      );
    });
  }
);

export const patchMe = createThunkedAction("USER_PATCH", (username, email) => {
  return backend.patchMe(username, email);
});

export const requestPasswordReset = createThunkedAction(
  "USER_RESET_PASSWORD_REQUEST",
  (email) => {
    return backend.requestPasswordReset(email);
  }
);

export const resetPassword = createThunkedAction(
  "USER_RESET_PASSWORD",
  (email, pwdResetKey, password, passwordConfirmation) => {
    return backend.resetPassword(
      email,
      pwdResetKey,
      password,
      passwordConfirmation
    );
  }
);

export const register = createThunkedAction("USER_REGISTER", (email) => {
  return backend.register(email);
});

export const activate = createThunkedAction(
  "USER_ACTIVATE",
  (email, activationKey, password, passwordConfirmation) => {
    return backend.activate(
      email,
      activationKey,
      password,
      passwordConfirmation
    );
  }
);

export const clearUserIdentity = createThunkedAction("USER_CLEAR", () => {
  return backend.logout();
});

export const loadUserApiTokens = createThunkedAction(
  "USER_LOAD_API_TOKENS",
  ({ dispatch, getState }) => {
    return retryIfUnauthorized(backend.loadApiTokens, dispatch)();
  }
);

export const addUserApiToken = createThunkedAction(
  "USER_ADD_API_TOKEN",
  (orguuid, name, { dispatch, getState }) => {
    return retryIfUnauthorized(backend.addApiToken, dispatch)(orguuid, name);
  }
);

export const deleteUserApiToken = createThunkedAction(
  "USER_DELETE_API_TOKEN",
  (jti, { dispatch }) => {
    return retryIfUnauthorized(backend.deleteApiToken, dispatch)(jti);
  }
);
