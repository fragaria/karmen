import Cookies from "js-cookie";
import { performRequest } from "./utils";

export const requestPasswordReset = (email) => {
  return performRequest({
    uri: `/users/me/request-password-reset`,
    useAuth: false,
    data: {
      email,
    },
    parseResponse: false,
    successCodes: [202],
  });
};

export const resetPassword = (
  email,
  pwdResetKey,
  password,
  passwordConfirmation
) => {
  return performRequest({
    uri: `/users/me/reset-password`,
    useAuth: false,
    data: {
      email,
      pwd_reset_key: pwdResetKey,
      password,
      password_confirmation: passwordConfirmation,
    },
    parseResponse: false,
    successCodes: [204],
  });
};

export const register = (email) => {
  return performRequest({
    uri: `/users/me`,
    useAuth: false,
    data: {
      email,
    },
    parseResponse: false,
    successCodes: [202],
  });
};

export const activate = (
  email,
  activationKey,
  password,
  passwordConfirmation
) => {
  return performRequest({
    uri: `/users/me/activate`,
    useAuth: false,
    data: {
      email,
      activation_key: activationKey,
      password,
      password_confirmation: passwordConfirmation,
    },
    parseResponse: false,
    successCodes: [204],
  });
};

export const authenticate = (username, password) => {
  return performRequest({
    uri: `/tokens/`,
    useAuth: false,
    data: {
      username,
      password,
    },
    successCodes: [200],
  });
};

export const authenticateFresh = (username, password) => {
  return performRequest({
    uri: `/users/me/authenticate-fresh`,
    useAuth: false,
    data: {
      username,
      password,
    },
    successCodes: [200],
  });
};

export const refreshAccessToken = () => {
  return performRequest({
    uri: `/tokens/refresh/`,
    useAuth: false,
    data: {refresh: localStorage.getItem("csrf_refresh_token")},
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-TOKEN": Cookies.get("csrf_refresh_token"),
    },
    successCodes: [200],
  });
};

export const logout = () => {
  return performRequest({
    uri: `/tokens/mine/`,
    method: "DELETE",
    parseResponse: false,
    successCodes: [204, 403],
  })
    .catch(() => {
      // When logout fails on server error, we shouldn't fail and just clear out
      // local state.
    })
    .finally(() => {
      Cookies.remove("csrf_refresh_token");
      Cookies.remove("refresh_token_cookie");
      Cookies.remove("csrf_access_token");
      Cookies.remove("access_token_cookie");
    });
};

export const changePassword = (
  password,
  new_password,
  new_password_confirmation
) => {
  return performRequest({
    uri: `/users/me/password`,
    method: "PATCH",
    data: {
      password,
      new_password,
      new_password_confirmation,
    },
    successCodes: [200],
  });
};

export const patchMe = (username, email) => {
  return performRequest({
    uri: `/users/me`,
    method: "PATCH",
    data: {
      username,
      email,
    },
    successCodes: [200],
  });
};

export const loadApiTokens = () => {
  return performRequest({
    uri: `/users/me/tokens`,
    method: "GET",
    successCodes: [200],
  });
};

export const addApiToken = (orgId, name) => {
  return performRequest({
    uri: `/users/me/tokens`,
    data: {
      name: name,
      organization_uuid: orgId,
    },
    successCodes: [201],
  }).then((response) => response.data.access_token);
};

export const deleteApiToken = (jti) => {
  return performRequest({
    uri: `/users/me/tokens/${jti}`,
    method: "DELETE",
    parseResponse: false,
    successCodes: [204, 404],
  });
};
