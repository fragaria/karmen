import { setAccessToken, setRefreshToken, getUserIdentity, getHeaders } from './utils';
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