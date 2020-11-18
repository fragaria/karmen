import Cookies from "js-cookie";
import { performRequest } from "./utils";

export const requestPasswordReset = (email) => {
  return performRequest({
    uri: `/users/password-reset/request/`,
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
    uri: `/users/password-reset/confirm/`,
    method: "post",
    useAuth: false,
    data: {
      email,
      token: pwdResetKey,
      password,
      password_confirmation: passwordConfirmation,
    },
    parseResponse: false,
    successCodes: [204],
  });
};

export const register = (email) => {
  return performRequest({
    uri: `/invitations/`,
    useAuth: false,
    data: {
      email,
    },
    parseResponse: false,
    successCodes: [201],
  });
};

export const activate = (
  email,
  activationKey,
  password,
  passwordConfirmation
) => {
  return performRequest({
    uri: `/users/`,
    useAuth: false,
    data: {
      token: activationKey,
      password,
    },
    parseResponse: false,
    successCodes: [204],
  });
};

export const authenticate = (username, password) => {
  return performRequest({
    uri: `/tokens/?fields=user,groups,role`,
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
    uri: `/legacy-api/tokens/refresh/?fields=groups,user,role`,
    useAuth: false,
    data: { refresh: localStorage.getItem("karmen_refresh_token") },
    headers: {
      "Content-Type": "application/json",
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
      Cookies.remove("karmen_refresh_token");
      Cookies.remove("karmen_access_token");
    });
};

export const changePassword = (password, new_password) => {
  return performRequest({
    uri: `/users/me/`,
    method: "PATCH",
    data: {
      old_password: password,
      password: new_password,
    },
    successCodes: [204],
    parseResponse: false,
  });
};

export const loadApiTokens = () => {
  return performRequest({
    uri: `/users/me/api_keys/`,
    method: "GET",
    successCodes: [200],
  });
};

export const addApiToken = (name, scope) => {
  return performRequest({
    uri: `/users/me/api_keys/`,
    data: {
      name: name,
      scope: scope,
    },
    successCodes: [201],
  });
};

export const deleteApiToken = (id) => {
  return performRequest({
    uri: `/users/me/api_keys/${id}/`,
    method: "DELETE",
    parseResponse: false,
    appendData: { data: { id: id } },
    successCodes: [204, 404],
  });
};
