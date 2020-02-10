import dayjs from "dayjs";
import Cookies from "js-cookie";

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

export const persistUserProfile = data => {
  _setStorage("karmen_profile", JSON.stringify(data));
};

export const dropUserProfile = () => {
  _setStorage("karmen_profile", null);
};

export const getUserProfile = () => {
  const profile = JSON.parse(_getStorage("karmen_profile"));
  if (profile) {
    profile.accessTokenExpiresOn = dayjs(profile.accessTokenExpiresOn);
  }
  return profile;
};

export const getHeaders = (withAuth = true) => {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  if (withAuth) {
    headers.set("X-CSRF-TOKEN", Cookies.get("csrf_access_token"));
  }
  return headers;
};
