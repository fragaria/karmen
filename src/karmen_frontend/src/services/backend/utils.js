import jwt_decode from 'jwt-decode';

const BASE_URL = window.env.BACKEND_BASE;

const _setStorage = (key, value) => {
  if (window.localStorage && window.localStorage.setItem) {
    window.localStorage.setItem(key, value);
  } else if (window.sessionStorage && window.sessionStorage.setItem) {
    window.sessionStorage.setItem(value, value);
  }
}

const _getStorage = (key) => {
  if (window.localStorage && window.localStorage.getItem) {
    return window.localStorage.getItem(key);
  } else if (window.sessionStorage && window.sessionStorage.getItem) {
    return window.sessionStorage.getItem(key);
  }
  return null;
}

export const setAccessToken = (token) => {
  const decoded = jwt_decode(token);
  _setStorage("karmen_uuid", decoded.identity);
  return _setStorage("karmen_accesst", token);
}

export const getAccessToken = () => {
  return _getStorage("karmen_accesst");
}

export const setRefreshToken = (token) => {
  return _setStorage("karmen_refresht", token);
}

export const getRefreshToken = () => {
  return _getStorage("karmen_refresht");
}

export const getUserIdentity = () => {
  return _getStorage("karmen_uuid");
}

export const currentLoginState = () => {
  const token = getAccessToken();
  if (token) {
    return fetch(`${BASE_URL}/users/probe`, {
        headers: getHeaders(),
      })
      .then((response) => {
        if (response.status === 200) {
          return response.json()
            .then((data) => {
              const decoded = jwt_decode(token);
              if (
                (decoded && decoded.user_claims && decoded.user_claims.force_pwd_change) ||
                (data && data.force_pwd_change)
              ) {
                return 'pwd-change-required';
              }
              return 'logged-in';
            });
        }
        return 'logged-out';
      }).catch((e) => {
        console.error(`Cannot get login state: ${e}`);
        return 'logged-out';
      });
  }
  return Promise.resolve('logged-out');
}

export const getHeaders = (withAuth=true) => {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  let token = getAccessToken();
  if (token && withAuth) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  // TODO side-effect ask for a fresh access_token if viable
  return headers;
}