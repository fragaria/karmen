import { getHeaders } from "./utils";

const BASE_URL = window.env.BACKEND_BASE;

export const addOrganization = name => {
  return fetch(`${BASE_URL}/organizations`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      name
    })
  })
    .then(response => {
      if (response.status !== 201) {
        console.error(`Cannot create organization: ${response.status}`);
        return { status: response.status };
      }
      return response.json().then(data => {
        return { status: response.status, data };
      });
    })
    .catch(e => {
      console.error(`Cannot create organization: ${e}`);
      return {};
    });
};

export const patchOrganization = (uuid, name) => {
  return fetch(`${BASE_URL}/organizations/${uuid}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({
      name
    })
  })
    .then(response => {
      if (response.status !== 200) {
        console.error(`Cannot update organization: ${response.status}`);
        return { status: response.status };
      }
      return response.json().then(data => {
        return { status: response.status, data };
      });
    })
    .catch(e => {
      console.error(`Cannot update organization: ${e}`);
      return {};
    });
};

export const getOrganizations = () => {
  return fetch(`${BASE_URL}/organizations`, {
    headers: getHeaders()
  })
    .then(response => {
      if (response.status !== 200) {
        console.error(`Cannot get list of organizations: ${response.status}`);
        return { status: response.status };
      }
      return response.json().then(data => {
        return { status: response.status, data };
      });
    })
    .catch(e => {
      console.error(`Cannot get list of organizations: ${e}`);
      return {};
    });
};
