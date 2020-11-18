import jwt_decode from "jwt-decode";
import { createHttpAction } from "./utils";
import { HttpError, UnauthorizedError } from "../errors";
import * as backend from "../services/backend";

export const retryIfUnauthorized = (func, dispatch) => {
  return (...args) => {
    return func(...args).catch((err) => {
      if (
        dispatch &&
        err instanceof HttpError &&
        (err.response.status === 401 || err.response.status === 403)
      ) {
        return dispatch(refreshToken())
          .then((r) => {
            return func(...args);
          })
          .catch((newErr) => {
            dispatch(clearUserIdentity());
            return Promise.reject(err);
          });
      }

      throw err;
    });
  };
};

export const denyWithNoOrganizationAccess = (orgid, getState, wrapped) => {
  const { me } = getState();
  if (!me.organizations || !me.organizations[orgid]) {
    return Promise.reject(
      new UnauthorizedError(
        "The organization does not exist or the user is not authorized to view it."
      )
    );
  }
  return wrapped();
};

export const loadUserFromToken = (token) => (dispatch) => {
  const decoded = jwt_decode(token);
  localStorage.setItem("karmen_access_token", token);
  dispatch(
    loadUserData({
      identity: decoded.identity,
      username: decoded.user_claims && decoded.user_claims.username,
      email: decoded.user_claims && decoded.user_claims.email,
      organizations: {
        [decoded.user_claims && decoded.user_claims.organization_uuid]: {
          role: "user",
          id: decoded.user_claims && decoded.user_claims.organization_uuid,
          name: decoded.user_claims && decoded.user_claims.organization_name,
        },
      },
      systemRole: "user",
      hasFreshToken: decoded.fresh,
      accessTokenExpiresOn: undefined,
    })
  );
};

export const loadUserFromLocalStorage = () => (dispatch) => {
  const profile = backend.getUserProfile();
  // no profile - bail
  if (!profile) {
    return Promise.resolve(dispatch(clearUserIdentity()));
  }

  return backend
    .refreshAccessToken()
    .then((r) => Promise.resolve(dispatch(loadUserData(r.data))))
    .catch(() => Promise.resolve(dispatch(clearUserIdentity())));
};

export const switchOrganization = (id) => (dispatch) => {
  dispatch({
    type: "USER_SWITCH_ORGANIZATION",
    payload: {
      data: {
        id,
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
    dispatch(switchOrganization(userData.activeOrganization.id));
  } else {
    const prefs = backend.getUserPreferences();
    if (
      prefs &&
      prefs.activeOrganizationId &&
      userData.groups[prefs.activeOrganizationId]
    ) {
      dispatch(switchOrganization(prefs.activeOrganizationId));
    } else {
      const org = userData.groups && Object.values(userData.groups)[0];
      dispatch(switchOrganization(org.id));
    }
  }
};

export const authenticate = createHttpAction(
  "USER_AUTHENTICATE",
  (username, password) => {
    return backend.authenticate(username, password);
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
  (password, new_password, new_password_confirmation) => {
    return backend.changePassword(
      password,
      new_password,
      new_password_confirmation
    );
  }
);

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
  (name, scope, { dispatch, getState }) => {
    console.log("add api token fired");
    return retryIfUnauthorized(backend.addApiToken, dispatch)(name, scope);
  }
);

export const deleteUserApiToken = createHttpAction(
  "USER_DELETE_API_TOKEN",
  (token_id, { dispatch }) => {
    return retryIfUnauthorized(backend.deleteApiToken, dispatch)(token_id);
  }
);
