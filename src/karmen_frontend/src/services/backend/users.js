import { getHeaders } from "./utils";

const BASE_URL = window.env.BACKEND_BASE;

export const getUsers = (orgUuid, fields = []) => {
  let uri = `${BASE_URL}/organizations/${orgUuid}/users`;
  if (fields && fields.length) {
    uri += `?fields=${fields.join(",")}`;
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

export const addUser = (orgUuid, email, role) => {
  return fetch(`${BASE_URL}/organizations/${orgUuid}/users`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      email,
      role: role
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

export const patchUser = (orgUuid, uuid, role) => {
  return fetch(`${BASE_URL}/organizations/${orgUuid}/users/${uuid}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({
      role: role
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

export const deleteUser = (orgUuid, uuid) => {
  return fetch(`${BASE_URL}/organizations/${orgUuid}/users/${uuid}`, {
    method: "DELETE",
    headers: getHeaders()
  })
    .then(response => {
      if (response.status !== 204) {
        console.error(`Cannot delete user: ${response.status}`);
      }
      return { status: response.status, data: { uuid } };
    })
    .catch(e => {
      console.error(`Cannot delete a user: ${e}`);
      return { status: 500 };
    });
};
