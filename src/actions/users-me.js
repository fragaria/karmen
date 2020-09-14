import jwt_decode from "jwt-decode";
import { createHttpAction } from "./utils";
import { HttpError, UnauthorizedError } from "../errors";
import * as backend from "../services/backend";
import {getUserPreferences,} from "../services/backend";
export const retryIfUnauthorized = (func, dispatch) => {
  console.log("RETRYIFUNAUTHORIZED CALLED")
  return (...args) => {
    return func(...args).catch((err) => {
      if (dispatch && err instanceof HttpError && (err.response.status === 401 || err.response.status === 403)) {
        return dispatch(refreshToken())
          .then((r) => {
            console.log("refresh args", ...args)
            func(...args)})
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
  console.log("loading user from token", token)
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

export const loadUserFromLocalStorage = (force_refresh = false) => (
  dispatch
) => {
  const token = localStorage.getItem('karmen_access_token');
  // no token - bail
  if (!token) {
    console.log("no token, bail")
    console.log("no token, bail")
    console.log("no token, bail")
    console.log("no token, bail")
    console.log("no token, bail")
    console.log("no token, bail")
    console.log("no token, bail")
    console.log("no token, bail")
    console.log("no token, bail")
    console.log("no token, bail")
    console.log("no token, bail")
    console.log("no token, bail")
    console.log("no token, bail")
    return Promise.resolve(dispatch(clearUserIdentity()));
  }
// try to load profile from API, fail if token expired
  console.log("loading profile")
  return backend
    .refreshAccessToken()
    .then((r) => {
      console.log("refresh happend", r.data)
      localStorage.setItem("karmen_access_token", r.data.access);
      return backend.getUserMe().then((r) => {
        let groups = r.data.groups;
        r.data.groups = {}
        groups.forEach(g => {
          r.data.groups[g.id]  = g;
        });
        Promise.resolve(dispatch(loadUserData(r.data)))
      })
    })
    .catch((e) => {
      console.log(e);
      Promise.resolve(dispatch(clearUserIdentity()))
    });

};

export const switchOrganization = (id) => (dispatch) => {
  console.log("SWITCHING USER ORGANIZATION!!!!!!!!!!!!!!")
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
  console.log("loading user data")
  dispatch({
    type: "USER_DATA_LOADED",
    payload: {
      data: userData,
    },
  });
  console.log("dspatch over")
  if (userData.activeOrganization) {
      console.log("crash id 1")
    dispatch(switchOrganization(userData.activeOrganization.id));
  } else {
    const prefs = backend.getUserPreferences();
    if (
      prefs &&
      prefs.activeOrganizationId &&
      userData.groups[prefs.activeOrganizationId]
    ) {
      console.log("switch org", prefs)
      // dispatch(switchOrganization(prefs.activeOrganizationId));
    } else {
      const org = userData.groups && Object.values(userData.groups)[0];
      console.log("crash id 2")
      console.log(prefs)
      console.log(userData)
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

export const authenticateFresh = createHttpAction(
  "USER_AUTHENTICATE_FRESH",
  (username, password) => {
    return backend.authenticateFresh(username, password);
  }
);

export const refreshToken = createHttpAction(
  "USER_REFRESH_ACCESS_TOKEN",
  () => {
    console.log("dispatching token refersh")
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
  console.log("clearing user identity")
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
