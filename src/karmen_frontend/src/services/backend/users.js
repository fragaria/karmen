import dayjs from 'dayjs';
import jwt_decode from 'jwt-decode';

import { setAccessToken, setRefreshToken, getUserIdentity, getHeaders, getRefreshToken, getAccessToken } from './utils';
const BASE_URL = window.env.BACKEND_BASE;

export const authenticate  = (username, password) => {
    return fetch(`${BASE_URL}/users/authenticate`, {
    method: 'POST',
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      username,
      password,
    }),
  })
    .then((response) => {
      if (response.status === 200) {
        return response.json()
          .then((data) => {
            setAccessToken(data.access_token);
            setRefreshToken(data.refresh_token);
            return response.status;
          });
      } else {
        console.error(`Cannot log in: ${response.status}`);
      }
      return response.status;
    }).catch((e) => {
      console.error(`Cannot log in: ${e}`);
      return 500;
    });
}

export const changePassword  = (password, new_password, new_password_confirmation) => {
    return fetch(`${BASE_URL}/users/${getUserIdentity()}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({
      password,
      new_password,
      new_password_confirmation,
    }),
  })
    .then((response) => {
      if (response.status === 200) {
        return response.json()
          .then((data) => {
            setAccessToken(data.access_token);
            return response.status;
          });
      } else {
        console.error(`Cannot change password: ${response.status}`);
      }
      return response.status;
    }).catch((e) => {
      console.error(`Cannot change password: ${e}`);
      return 500;
    });
}

export const refreshAccessToken = () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return Promise.resolve(401);
  }
  const decoded = jwt_decode(refreshToken);
  if (decoded.exp && dayjs().isAfter(dayjs(decoded.exp * 1000))) {
    return Promise.resolve(401);
  }
  return fetch(`${BASE_URL}/users/authenticate-refresh`, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${refreshToken}`,
    },
  }).then((response) => {
    return response.json()
      .then((data) => {
        setAccessToken(data.access_token);
        return response.status;
      });
  });
}

let accessTokenExpirationHandler = null;

export const registerAccessTokenExpirationHandler = (timeout=60000) => {
  const accessTokenCheck = () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      return Promise.resolve(true);
    }
    const decoded = jwt_decode(accessToken);
    // Probably an eternal token
    if (!decoded.exp) {
      return Promise.resolve(true);
    }
    let expiresAt = dayjs(decoded.exp * 1000);
    expiresAt = expiresAt.subtract(3 * timeout / 1000, 'seconds');
    if (dayjs().isAfter(expiresAt)) {
      return refreshAccessToken();
    }
    return Promise.resolve(true);
  };
  const periodicAccessTokenCheck = () => {
    accessTokenCheck()
      .then(() => {
        accessTokenExpirationHandler = setTimeout(periodicAccessTokenCheck, timeout);
      })
  };
  periodicAccessTokenCheck();
}

export const deregisterAccessTokenExpirationHandler = () => {
  if (accessTokenExpirationHandler) {
    clearTimeout(accessTokenExpirationHandler);
  }
}

export const checkCurrentLoginState = () => {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  if (!accessToken) {
    return Promise.resolve('logged-out');
  }
  const decodedAccess = jwt_decode(accessToken);
  if (accessToken && refreshToken) {
    const decodedRefresh = jwt_decode(refreshToken);
    if (decodedAccess.exp && decodedRefresh.exp) {
      let accessExpiresAt = dayjs(decodedAccess.exp * 1000);
      let refreshExpiresAt = dayjs(decodedRefresh.exp * 1000);
      if (dayjs().isAfter(accessExpiresAt) && dayjs().isAfter(refreshExpiresAt)) {
        return Promise.resolve('logged-out');
      }
    }
  }

  if (accessToken) {
    return fetch(`${BASE_URL}/users/probe`, {
        headers: getHeaders(),
      })
      .then((response) => {
        if (response.status === 200) {
          return response.json()
            .then((data) => {
              if (
                (decodedAccess && decodedAccess.user_claims && decodedAccess.user_claims.force_pwd_change) ||
                (data && data.force_pwd_change)
              ) {
                return 'pwd-change-required';
              }
              return 'logged-in';
            });
        } else if (response.status === 401) {
          return response.json()
            .then((data) => {
              if (data.message && data.message.indexOf("expired") > -1) {
                return refreshAccessToken()
                  .then((status) => {
                    if (status === 200) {
                      return 'logged-in';
                    }
                    return 'logged-out';
                  });
              }
              return 'logged-out';
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