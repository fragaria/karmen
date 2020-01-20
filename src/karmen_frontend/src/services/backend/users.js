import { getHeaders } from "./utils";

const BASE_URL = window.env.BACKEND_BASE;

export const getUsers = (
  startWith = null,
  orderBy = null,
  filter = null,
  limit = 15
) => {
  let uri = `${BASE_URL}/users?limit=${limit}`;
  if (startWith) {
    uri += `&start_with=${encodeURIComponent(startWith)}`;
  }
  if (orderBy) {
    uri += `&order_by=${encodeURIComponent(orderBy)}`;
  }
  if (filter) {
    uri += `&filter=username:${encodeURIComponent(filter)}`;
  }
  return fetch(uri, {
    headers: getHeaders()
  })
    .then(response => {
      if (response.status !== 200) {
        console.error(`Cannot get list of users: ${response.status}`);
      }
      return response.json().then(data => {
        return { status: response.status, data };
      });
    })
    .catch(e => {
      console.error(`Cannot get list of users: ${e}`);
      return {};
    });
};

export const addUser = (username, role, password, passwordConfirmation) => {
  return fetch(`${BASE_URL}/users`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      username,
      role,
      password,
      password_confirmation: passwordConfirmation
    })
  })
    .then(response => {
      if (response.status !== 201) {
        console.error(`Cannot add a user: ${response.status}`);
      }
      return (
        response
          .json()
          .then(data => {
            return {
              status: response.status,
              data
            };
          })
          // no JSON in response
          .catch(e => {
            return {
              status: response.status
            };
          })
      );
    })
    .catch(e => {
      console.error(`Cannot add a user: ${e}`);
      return {};
    });
};

export const patchUser = (uuid, role, suspended) => {
  return fetch(`${BASE_URL}/users/${uuid}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({
      role,
      suspended
    })
  })
    .then(response => {
      if (response.status !== 200) {
        console.error(`Cannot patch a user: ${response.status}`);
      }
      return response.json().then(data => {
        return { status: response.status, data };
      });
    })
    .catch(e => {
      console.error(`Cannot patch a user: ${e}`);
      return {};
    });
};
