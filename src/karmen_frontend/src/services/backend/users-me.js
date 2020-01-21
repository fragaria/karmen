import dayjs from "dayjs";
import jwt_decode from "jwt-decode";

import {
  setAccessToken,
  setRefreshToken,
  getUser,
  getHeaders,
  getRefreshToken,
  getAccessToken
} from "./utils";
const BASE_URL = window.env.BACKEND_BASE;

export const authenticate = (username, password) => {
  return fetch(`${BASE_URL}/users/me/authenticate`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      username,
      password
    })
  })
    .then(response => {
      return response.json().then(data => {
        if (response.status === 200) {
          setAccessToken(data.access_token);
          setRefreshToken(data.refresh_token);
        } else {
          console.error(`Cannot authenticate: ${response.status}`);
        }
        return {
          status: response.status,
          data: data
        };
      });
    })
    .catch(e => {
      console.error(`Cannot authenticate: ${e}`);
      return 500;
    });
};

export const authenticateFresh = (username, password) => {
  return fetch(`${BASE_URL}/users/me/authenticate-fresh`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      username,
      password
    })
  })
    .then(response => {
      if (response.status === 200) {
        return response.json().then(data => {
          setAccessToken(data.access_token);
          return response.status;
        });
      } else {
        console.error(
          `Cannot authenticate for a fresh token: ${response.status}`
        );
      }
      return response.status;
    })
    .catch(e => {
      console.error(`Cannot authenticate for a fresh token: ${e}`);
      return 500;
    });
};

export const changePassword = (
  password,
  new_password,
  new_password_confirmation
) => {
  // pwd change always needs a fresh token - since we know password here, we can always get one
  const accessToken = getAccessToken();
  if (!accessToken) {
    return Promise.resolve(401);
  }
  const decoded = jwt_decode(accessToken);
  const user = getUser();
  let beforePwdChange = Promise.resolve();
  if (decoded.fresh === false && user.username) {
    beforePwdChange = authenticateFresh(user.username, password).then(
      result => {
        if (result !== 200) {
          return Promise.reject("Cannot get a fresh token");
        }
      }
    );
  }

  return beforePwdChange
    .catch(e => {
      console.error(`Cannot change password: ${e}`);
      return 500;
    })
    .then(() => {
      return fetch(`${BASE_URL}/users/me`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({
          password,
          new_password,
          new_password_confirmation
        })
      })
        .then(response => {
          if (response.status === 200) {
            return response.json().then(data => {
              setAccessToken(data.access_token);
              return response.status;
            });
          } else {
            console.error(`Cannot change password: ${response.status}`);
          }
          return response.status;
        })
        .catch(e => {
          console.error(`Cannot change password: ${e}`);
          return 500;
        });
    });
};

export const refreshAccessToken = () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return Promise.resolve(401);
  }
  const decoded = jwt_decode(refreshToken);
  if (decoded.exp && dayjs().isAfter(dayjs(decoded.exp * 1000))) {
    return Promise.resolve(401);
  }
  return fetch(`${BASE_URL}/users/me/authenticate-refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${refreshToken}`
    }
  })
    .then(response => {
      if (response.status === 200) {
        return response.json().then(data => {
          setAccessToken(data.access_token);
          return response.status;
        });
      } else {
        console.error(`Cannot refresh access token: ${response.status}`);
      }
      return response.status;
    })
    .catch(e => {
      console.error(`Cannot refresh access token: ${e}`);
      return 500;
    });
};

// TODO move this to redux
let accessTokenExpirationHandler = null;

export const registerAccessTokenExpirationHandler = (
  timeout = 60000,
  onRefresh = () => {}
) => {
  const accessTokenCheck = () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      return Promise.resolve();
    }
    const decoded = jwt_decode(accessToken);
    // Probably an eternal token
    if (!decoded.exp) {
      return Promise.resolve();
    }
    let expiresAt = dayjs(decoded.exp * 1000);
    expiresAt = expiresAt.subtract((3 * timeout) / 1000, "seconds");
    if (dayjs().isAfter(expiresAt)) {
      return refreshAccessToken().then(status => {
        onRefresh && onRefresh(status === 200 ? getUser() : {});
      });
    }
    return Promise.resolve();
  };
  const periodicAccessTokenCheck = () => {
    accessTokenCheck().then(() => {
      accessTokenExpirationHandler = setTimeout(
        periodicAccessTokenCheck,
        timeout
      );
    });
  };
  periodicAccessTokenCheck();
};

export const deregisterAccessTokenExpirationHandler = () => {
  if (accessTokenExpirationHandler) {
    clearTimeout(accessTokenExpirationHandler);
  }
};

export const checkCurrentLoginState = () => {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  if (!accessToken) {
    return Promise.resolve({
      user: {},
      state: "logged-out"
    });
  }
  const decodedAccess = jwt_decode(accessToken);
  if (accessToken && refreshToken) {
    const decodedRefresh = jwt_decode(refreshToken);
    if (decodedAccess.exp && decodedRefresh.exp) {
      let accessExpiresAt = dayjs(decodedAccess.exp * 1000);
      let refreshExpiresAt = dayjs(decodedRefresh.exp * 1000);
      if (
        dayjs().isAfter(accessExpiresAt) &&
        dayjs().isAfter(refreshExpiresAt)
      ) {
        setAccessToken(null);
        setRefreshToken(null);
        return Promise.resolve({
          user: {},
          state: "logged-out"
        });
      }
    }
  }
  // TODO make this more efficient and do not probe if token had been obtained recently
  if (accessToken) {
    return fetch(`${BASE_URL}/users/me/probe`, {
      headers: getHeaders()
    })
      .then(response => {
        if (response.status === 200) {
          return response.json().then(data => {
            if (
              (decodedAccess &&
                decodedAccess.user_claims &&
                decodedAccess.user_claims.force_pwd_change) ||
              (data && data.force_pwd_change)
            ) {
              return {
                user: getUser(),
                state: "pwd-change-required"
              };
            }
            return {
              user: getUser(),
              state: "logged-in"
            };
          });
        } else if (response.status === 401) {
          return response.json().then(data => {
            if (data.message && data.message.indexOf("expired") > -1) {
              return refreshAccessToken().then(status => {
                if (status === 200) {
                  return {
                    user: getUser(),
                    state: "logged-in"
                  };
                }
                return {
                  user: {},
                  state: "logged-out"
                };
              });
            }
            return {
              user: {},
              state: "logged-out"
            };
          });
        }
        return {
          user: {},
          state: "logged-out"
        };
      })
      .catch(e => {
        console.error(`Cannot get login state: ${e}`);
        return {
          user: {},
          state: "logged-out"
        };
      });
  }
  return Promise.resolve("logged-out");
};

export const loadApiTokens = () => {
  return fetch(`${BASE_URL}/users/me/tokens`, {
    method: "GET",
    headers: getHeaders()
  })
    .then(response => {
      if (response.status !== 200) {
        console.error(`Cannot get list of api tokens: ${response.status}`);
      }
      return response.json().then(data => {
        return { status: response.status, data };
      });
    })
    .catch(e => {
      console.error(`Cannot get list of api tokens: ${e}`);
      return { status: 500, data: {} };
    });
};

export const addApiToken = name => {
  return fetch(`${BASE_URL}/users/me/tokens`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      name
    })
  })
    .then(response => {
      if (response.status !== 201) {
        console.error(`Cannot add an API token: ${response.status}`);
      }
      return response.json().then(data => {
        return { status: response.status, data };
      });
    })
    .catch(e => {
      console.error(`Cannot add an API token: ${e}`);
      return 500;
    });
};

export const deleteApiToken = jti => {
  return fetch(`${BASE_URL}/users/me/tokens/${jti}`, {
    method: "DELETE",
    headers: getHeaders()
  })
    .then(response => {
      if (response.status !== 204) {
        console.error(`Cannot remove an API token: ${response.status}`);
      }
      return response.status;
    })
    .catch(e => {
      console.error(`Cannot remove an API token: ${e}`);
      return 500;
    });
};
