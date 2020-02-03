import jwt_decode from "jwt-decode";

const _removeStorage = key => {
  if (window.localStorage && window.localStorage.removeItem) {
    window.localStorage.removeItem(key);
  } else if (window.sessionStorage && window.sessionStorage.removeItem) {
    window.sessionStorage.removeItem(key);
  }
};

const _setStorage = (key, value) => {
  if (value === null) {
    return _removeStorage(key);
  }
  if (window.localStorage && window.localStorage.setItem) {
    window.localStorage.setItem(key, value);
  } else if (window.sessionStorage && window.sessionStorage.setItem) {
    window.sessionStorage.setItem(value, value);
  }
};

const _getStorage = key => {
  if (window.localStorage && window.localStorage.getItem) {
    return window.localStorage.getItem(key);
  } else if (window.sessionStorage && window.sessionStorage.getItem) {
    return window.sessionStorage.getItem(key);
  }
  return null;
};

export const setAccessToken = token => {
  if (token) {
    const decoded = jwt_decode(token);
    _setStorage(
      "karmen_user",
      JSON.stringify({
        identity: decoded.identity,
        username: decoded.user_claims && decoded.user_claims.username,
        role: decoded.user_claims && decoded.user_claims.role,
        hasFreshToken: decoded.fresh
      })
    );
  } else {
    _setStorage("karmen_user", null);
  }
  return _setStorage("karmen_accesst", token);
};

export const getAccessToken = () => {
  return _getStorage("karmen_accesst");
};

export const setRefreshToken = token => {
  return _setStorage("karmen_refresht", token);
};

export const getRefreshToken = () => {
  return _getStorage("karmen_refresht");
};

export const getUser = () => {
  const data = _getStorage("karmen_user");
  if (data) {
    return JSON.parse(data);
  }
  return {};
};

export const getHeaders = (withAuth = true) => {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  let token = getAccessToken();
  if (token && withAuth) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
};
