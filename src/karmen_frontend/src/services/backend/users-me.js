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
  });
};

export const authenticate = (username, password) => {
  return performRequest({
    uri: `/users/me/authenticate`,
    useAuth: false,
    data: {
      username,
      password,
    },
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
  });
};

export const refreshAccessToken = () => {
  return performRequest({
    uri: `/users/me/authenticate-refresh`,
    useAuth: false,
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-TOKEN": Cookies.get("csrf_refresh_token"),
    },
  });
};

export const logout = () => {
  return performRequest({
    uri: `/users/me/logout`,
    parseResponse: false,
  }).then((response) => {
    Cookies.remove("csrf_refresh_token");
    Cookies.remove("refresh_token_cookie");
    Cookies.remove("csrf_access_token");
    Cookies.remove("access_token_cookie");
    return { status: response.status, successCodes: [200] };
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
  });
};

export const loadApiTokens = () => {
  return performRequest({
    uri: `/users/me/tokens`,
    method: "GET",
  });
};

export const addApiToken = (orgUuid, name) => {
  return performRequest({
    uri: `/users/me/tokens`,
    data: {
      name: name,
      organization_uuid: orgUuid,
    },
  });
};

export const deleteApiToken = (jti) => {
  return performRequest({
    uri: `/users/me/tokens/${jti}`,
    method: "DELETE",
    parseResponse: false,
    successCodes: [204, 404],
  });
};
