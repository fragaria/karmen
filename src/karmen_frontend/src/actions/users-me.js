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
          return Promise.resolve({});
        }
        return dispatch(refreshToken()).then(r => {
          if (r.status === 200) {
            return func(...args);
          } else {
            dispatch(clearUserIdentity());
            return Promise.resolve({});
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
      email: decoded.user_claims && decoded.user_claims.email,
      organizations: {
        [decoded.user_claims && decoded.user_claims.organization_slug]: {
          role: "user",
          uuid: decoded.user_claims && decoded.user_claims.organization_uuid,
          name: decoded.user_claims && decoded.user_claims.organization_name,
          slug: decoded.user_claims && decoded.user_claims.organization_slug
        }
      },
      systemRole: "user",
      hasFreshToken: decoded.fresh,
      accessTokenExpiresOn: undefined
    })
  );
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

export const switchOrganization = (uuid, slug) => dispatch => {
  dispatch({
    type: "USER_SWITCH_ORGANIZATION",
    payload: {
      data: {
        uuid,
        slug
      }
    }
  });
};

export const loadUserData = userData => dispatch => {
  dispatch({
    type: "USER_DATA_LOADED",
    payload: {
      data: userData
    }
  });
  if (userData.activeOrganization) {
    dispatch(
      switchOrganization(
        userData.activeOrganization.uuid,
        userData.activeOrganization.slug
      )
    );
  } else {
    const org =
      userData.organizations && Object.values(userData.organizations)[0];
    dispatch(switchOrganization(org.uuid, org.slug));
  }
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

export const requestPasswordReset = createActionThunk(
  "USER_RESET_PASSWORD_REQUEST",
  email => {
    return backend.requestPasswordReset(email);
  }
);

export const resetPassword = createActionThunk(
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

export const register = createActionThunk("USER_REGISTER", email => {
  return backend.register(email);
});

export const activate = createActionThunk(
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

export const clearUserIdentity = createActionThunk("USER_CLEAR", () => {
  return backend.logout();
});

export const loadUserApiTokens = createActionThunk(
  "USER_LOAD_API_TOKENS",
  ({ dispatch, getState }) => {
    return retryIfUnauthorized(backend.loadApiTokens, dispatch)();
  }
);

export const addUserApiToken = createActionThunk(
  "USER_ADD_API_TOKEN",
  (orguuid, name, { dispatch, getState }) => {
    return retryIfUnauthorized(backend.addApiToken, dispatch)(orguuid, name);
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
