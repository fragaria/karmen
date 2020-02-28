import Cookies from "js-cookie";
import { getHeaders } from "./utils";
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
      if (response.status !== 200) {
        console.error(`Cannot authenticate: ${response.status}`);
        return { status: response.status };
      }
      return response.json().then(data => {
        return {
          status: response.status,
          data: data
        };
      });
    })
    .catch(e => {
      console.error(`Cannot authenticate: ${e}`);
      return { status: 500 };
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
          return {
            status: response.status,
            data: data
          };
        });
      } else {
        console.error(
          `Cannot authenticate for a fresh token: ${response.status}`
        );
      }
      return { status: response.status };
    })
    .catch(e => {
      console.error(`Cannot authenticate for a fresh token: ${e}`);
      return { status: 500 };
    });
};

export const changePassword = (
  password,
  new_password,
  new_password_confirmation
) => {
  return fetch(`${BASE_URL}/users/me/password`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({
      password,
      new_password,
      new_password_confirmation
    })
  })
    .then(response => {
      if (response.status !== 200) {
        console.error(`Cannot change password: ${response.status}`);
        return { status: response.status };
      }
      return response.json().then(data => {
        return {
          status: response.status,
          data
        };
      });
    })
    .catch(e => {
      console.error(`Cannot change password: ${e}`);
      return { status: 500 };
    });
};

export const patchUser = (username, email) => {
  return fetch(`${BASE_URL}/users/me`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({
      username,
      email
    })
  })
    .then(response => {
      if (response.status !== 200) {
        console.error(`Cannot change user: ${response.status}`);
        return { status: response.status };
      }
      return response.json().then(data => {
        return {
          status: response.status,
          data
        };
      });
    })
    .catch(e => {
      console.error(`Cannot change user: ${e}`);
      return { status: 500 };
    });
};

export const requestPasswordReset = email => {
  return fetch(`${BASE_URL}/users/me/request-password-reset`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      email
    })
  })
    .then(response => {
      return { status: response.status };
    })
    .catch(e => {
      console.error(`Cannot send password reset request: ${e}`);
      return { status: 500 };
    });
};

export const resetPassword = (
  email,
  pwdResetKey,
  password,
  passwordConfirmation
) => {
  return fetch(`${BASE_URL}/users/me/reset-password`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      email,
      pwd_reset_key: pwdResetKey,
      password,
      password_confirmation: passwordConfirmation
    })
  })
    .then(response => {
      return { status: response.status };
    })
    .catch(e => {
      console.error(`Cannot reset password: ${e}`);
      return { status: 500 };
    });
};

export const register = email => {
  return fetch(`${BASE_URL}/users/me`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      email
    })
  })
    .then(response => {
      return { status: response.status };
    })
    .catch(e => {
      console.error(`Cannot reset password: ${e}`);
      return { status: 500 };
    });
};

export const activate = (
  email,
  activationKey,
  password,
  passwordConfirmation
) => {
  return fetch(`${BASE_URL}/users/me/activate`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      email,
      activation_key: activationKey,
      password,
      password_confirmation: passwordConfirmation
    })
  })
    .then(response => {
      return { status: response.status };
    })
    .catch(e => {
      console.error(`Cannot activate account: ${e}`);
      return { status: 500 };
    });
};

export const refreshAccessToken = () => {
  return fetch(`${BASE_URL}/users/me/authenticate-refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-TOKEN": Cookies.get("csrf_refresh_token")
    }
  })
    .then(response => {
      if (response.status === 200) {
        return response.json().then(data => {
          return {
            status: response.status,
            data: data
          };
        });
      }
      console.error(`Cannot refresh access token: ${response.status}`);
      return { status: response.status };
    })
    .catch(e => {
      console.error(`Cannot refresh access token: ${e}`);
      return { status: 500 };
    });
};

export const logout = () => {
  return fetch(`${BASE_URL}/users/me/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(response => {
      Cookies.remove("csrf_refresh_token");
      Cookies.remove("refresh_token_cookie");
      Cookies.remove("csrf_access_token");
      Cookies.remove("access_token_cookie");
      return { status: response.status };
    })
    .catch(e => {
      console.error(`Cannot logout: ${e}`);
      return { status: 500 };
    });
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

export const addApiToken = (orgUuid, name) => {
  return fetch(`${BASE_URL}/users/me/tokens`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      name: name,
      organization_uuid: orgUuid
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
      return { status: 500 };
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
