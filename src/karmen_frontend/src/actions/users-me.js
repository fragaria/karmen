import dayjs from "dayjs";
import Cookies from "js-cookie";
import jwt_decode from "jwt-decode";
import { createHttpAction } from "./utils";
import { HttpError } from "../errors";
import * as backend from "../services/backend";

export const retryIfUnauthorized = (func, dispatch) => {
  return (...args) => {
    return func(...args).catch((err) => {
      if (dispatch && err instanceof HttpError && err.response.status === 401) {
        return dispatch(refreshToken())
          .then((r) => func(...args))
          .catch((newErr) => {
            dispatch(clearUserIdentity());
            return Promise.reject(err);
          });
      }

      throw err;
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
    return backend
      .refreshAccessToken()
      .then((r) => Promise.resolve(dispatch(loadUserData(r.data))))
      .catch(() => Promise.resolve(dispatch(clearUserIdentity())));
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

export const authenticate = createHttpAction(
  "USER_AUTHENTICATE",
  (username, password) => {
    return backend.authenticate(username, password);
  }
);

export const authenticateFresh = createHttpAction(
  "USER_AUTHENTICATE_FRESH",
  (username, password) => {
    return backend.authenticateFresh(username, password);
  }
);

export const refreshToken = createHttpAction(
  "USER_REFRESH_ACCESS_TOKEN",
  () => {
    return backend.refreshAccessToken();
  }
);

export const changePassword = createHttpAction(
  "USER_CHANGE_PASSWORD",
  (
    password,
    new_password,
    new_password_confirmation,
    { dispatch, getState }
  ) => {
    const { me } = getState();
    return dispatch(authenticateFresh(me.username, password)).then((r) =>
      backend.changePassword(password, new_password, new_password_confirmation)
    );
  }
);

export const patchMe = createHttpAction("USER_PATCH", (username, email) => {
  return backend.patchMe(username, email);
});

export const requestPasswordReset = createHttpAction(
  "USER_RESET_PASSWORD_REQUEST",
  (email) => {
    return backend.requestPasswordReset(email);
  }
);

export const resetPassword = createHttpAction(
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

export const register = createHttpAction("USER_REGISTER", (email) => {
  return backend.register(email);
});

export const activate = createHttpAction(
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

export const clearUserIdentity = createHttpAction("USER_CLEAR", () => {
  return backend.logout();
});

export const loadUserApiTokens = createHttpAction(
  "USER_LOAD_API_TOKENS",
  ({ dispatch, getState }) => {
    return retryIfUnauthorized(backend.loadApiTokens, dispatch)();
  }
);

export const addUserApiToken = createHttpAction(
  "USER_ADD_API_TOKEN",
  (orguuid, name, { dispatch, getState }) => {
    return retryIfUnauthorized(backend.addApiToken, dispatch)(orguuid, name);
  }
);

export const deleteUserApiToken = createHttpAction(
  "USER_DELETE_API_TOKEN",
  (jti, { dispatch }) => {
    return retryIfUnauthorized(backend.deleteApiToken, dispatch)(jti);
  }
);
